import { ChatMessage, ChatbotSettings, ApiKeyStats } from '../types';
import { getChatbotSettings, saveChatbotSettings } from './userDataService';

const CEREBRAS_API_URL = 'https://corsproxy.io/?https://api.cerebras.ai/v1/chat/completions';
// Defines the model fallback sequence.
const MODELS = ['llama3.1-70b', 'llama3.1-8b', 'llama3-70b'];

// This function finds the next best key to use.
// It prioritizes active keys that haven't been used for the longest time.
// If all keys have failed, it falls back to the least recently used key to retry.
const getNextApiKey = (keys: ApiKeyStats[]): [ApiKeyStats | null, number] => {
  if (!keys || keys.length === 0) return [null, -1];

  const activeKeys = keys.filter(k => k.status === 'active');

  if (activeKeys.length > 0) {
    // Find the least recently used key among active ones for rotation.
    const sortedActive = activeKeys.sort((a,b) => new Date(a.lastUsed || 0).getTime() - new Date(b.lastUsed || 0).getTime());
    const nextKey = sortedActive[0];
    const originalIndex = keys.findIndex(k => k.key === nextKey.key);
    return [nextKey, originalIndex];
  }

  // Fallback: If no active keys, retry the least recently used key overall.
  const sortedAll = [...keys].sort((a,b) => new Date(a.lastUsed || 0).getTime() - new Date(b.lastUsed || 0).getTime());
  const fallbackKey = sortedAll[0];
  const fallbackIndex = keys.findIndex(k => k.key === fallbackKey.key);
  
  if (fallbackKey) {
    return [fallbackKey, fallbackIndex];
  }
  
  return [null, -1];
};


export const generateChatResponse = async (messages: ChatMessage[]): Promise<string> => {
    const settings = await getChatbotSettings();
    if (!settings.apiKeys || settings.apiKeys.length === 0) {
        return "Error: No API keys are configured. Please contact the administrator.";
    }

    // Attempt each available key at most once per user request to prevent infinite loops.
    for (let i = 0; i < settings.apiKeys.length; i++) {
        const [apiKeyStat, keyIndex] = getNextApiKey(settings.apiKeys);

        if (!apiKeyStat) {
            break; // No keys are available to try.
        }
        
        const keyToTry = settings.apiKeys[keyIndex];
        let isKeyInvalid = false;

        // Attempt each model in the fallback list with the current key.
        for (const model of MODELS) {
            try {
                // Optimistically set a failed key to 'active' for a retry attempt.
                if (keyToTry.status !== 'active') {
                    keyToTry.status = 'active';
                }

                const systemMessage = { role: 'system', content: settings.personality };
                const payload = {
                    model: model,
                    messages: [systemMessage, ...messages],
                    max_tokens: 4096,
                    temperature: 0.3,
                    stream: false,
                };

                const response = await fetch(CEREBRAS_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyToTry.key}`,
                    },
                    body: JSON.stringify(payload),
                });
                
                // Always update lastUsed time for rotation logic.
                keyToTry.lastUsed = new Date().toISOString();

                if (response.ok) {
                    const data = await response.json();
                    keyToTry.usageCount += 1;
                    await saveChatbotSettings(settings);
                    return data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
                }

                // Handle non-OK responses:
                // If it's a 401 (Unauthorized) or 429 (Rate Limit), the key is bad.
                const isKeyError = response.status === 401 || response.status === 429;
                if (isKeyError) {
                    keyToTry.status = response.status === 429 ? 'rate-limited' : 'failed';
                    console.warn(`API key ${keyToTry.key.substring(0, 8)}... failed (status ${response.status}). Trying next key.`);
                    isKeyInvalid = true;
                    break; // Stop trying models with this failed key and get a new one.
                } else {
                    // Otherwise, it might be a model-specific issue (e.g., 404), so try the next model.
                    console.warn(`Model '${model}' failed with status ${response.status}. Trying next model in fallback list...`);
                }

            } catch (error) {
                // A network error likely means the key is bad or the service is down.
                keyToTry.lastUsed = new Date().toISOString();
                keyToTry.status = 'failed';
                console.error(`Network error with API key ${keyToTry.key.substring(0, 8)}...`, error);
                isKeyInvalid = true;
                break; // Stop trying models and get a new key.
            }
        }
        
        // Save any status changes to the key before the next iteration.
        await saveChatbotSettings(settings);
        
        // If the key failed, the outer loop will now fetch the next available key.
    }

    // This message is returned only if all keys and all models have failed.
    return "I'm having a bit of trouble thinking right now. Please give me a moment and try again.";
};