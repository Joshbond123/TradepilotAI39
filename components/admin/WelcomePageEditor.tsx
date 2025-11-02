
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomePageTemplate } from '../../types';
import { getWelcomePageTemplate, saveWelcomePageTemplate } from '../../services/userDataService';
import { Save, Eye, Trash2 } from 'lucide-react';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

const WelcomePageEditor: React.FC = () => {
    const [template, setTemplate] = useState<WelcomePageTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const loadTemplate = useCallback(async () => {
        setIsLoading(true);
        const data = await getWelcomePageTemplate();
        setTemplate(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadTemplate();
    }, [loadTemplate]);

    const handleSave = async () => {
        if (template) {
            try {
                setIsSaving(true);
                setErrorMessage('');
                setSaveStatus('Saving template to server...');
                
                console.log('Saving template...', { 
                    hasImage: !!template.imageUrl, 
                    hasVideo: !!template.videoUrl,
                    imageSize: template.imageUrl?.length || 0,
                    videoSize: template.videoUrl?.length || 0
                });
                
                await saveWelcomePageTemplate(template);
                
                console.log('Template saved successfully');
                setSaveStatus('✅ Template saved successfully! Changes are permanent.');
                setTimeout(() => setSaveStatus(''), 4000);
            } catch (error) {
                console.error('Failed to save template:', error);
                setErrorMessage(`❌ Failed to save template. ${error instanceof Error ? error.message : 'Try a smaller video or check your connection.'}`);
                setTimeout(() => setErrorMessage(''), 6000);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (template) {
            setTemplate({ ...template, [e.target.name]: e.target.value });
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        
        console.log('File upload triggered:', { type, file: file?.name, size: file?.size });
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        if (!template) {
            console.error('Template not loaded');
            setErrorMessage('Template not loaded. Please refresh the page.');
            return;
        }
        
        const maxSizeMB = 100;
        const fileSizeMB = file.size / (1024 * 1024);
        
        console.log(`File size: ${fileSizeMB.toFixed(2)}MB`);
        
        if (fileSizeMB > maxSizeMB) {
            setErrorMessage(`File too large! Maximum size is ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`);
            setTimeout(() => setErrorMessage(''), 5000);
            e.target.value = '';
            return;
        }
        
        setErrorMessage('');
        setSaveStatus(`Uploading ${type}... (${fileSizeMB.toFixed(1)}MB)`);
        
        try {
            console.log(`Converting ${type} to base64...`);
            const base64 = await fileToBase64(file);
            console.log(`${type} converted successfully, uploading to server...`);
            
            setSaveStatus(`Uploading ${type} to server...`);
            
            const response = await fetch('/api/storage/upload-media', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'welcome_page',
                    mediaType: type,
                    data: base64
                }),
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Upload failed');
            }
            
            console.log(`${type} uploaded successfully:`, result.url);
            
            if (type === 'image') {
                setTemplate({ ...template, imageUrl: result.url, videoUrl: '' });
            }
            if (type === 'video') {
                setTemplate({ ...template, videoUrl: result.url, imageUrl: '' });
            }
            
            setSaveStatus(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} uploaded! Click "Save Template" to confirm.`);
            setTimeout(() => setSaveStatus(''), 5000);
        } catch (error) {
            console.error(`Failed to upload ${type}:`, error);
            setErrorMessage(`Failed to upload ${type}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const removeMedia = (type: 'image' | 'video') => {
        if(template) {
            if(type === 'image') setTemplate({...template, imageUrl: ''});
            if(type === 'video') setTemplate({...template, videoUrl: ''});
        }
    }

    if (isLoading || !template) {
        return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome Page Template</h1>
            <p className="text-brand-text-secondary">This is the full-screen page a user sees immediately after registration. Use it for a strong visual welcome.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">Editor</h2>
                    <div>
                        <label className="text-sm text-brand-text-secondary">Title</label>
                        <input type="text" name="title" value={template.title} onChange={handleInputChange} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                    </div>
                    <div>
                        <label className="text-sm text-brand-text-secondary">Message Body</label>
                        <textarea name="text" value={template.text} onChange={handleInputChange} rows={8} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                    </div>
                     <div>
                        <label className="text-sm text-brand-text-secondary">Image (replaces video if both are set)</label>
                        <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image')} className="w-full mt-1 p-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/40 text-sm text-brand-text-secondary bg-brand-bg rounded border border-white/20"/>
                    </div>
                     <div>
                        <label className="text-sm text-brand-text-secondary">Video (replaces image if both are set)</label>
                        <input type="file" accept="video/*" onChange={e => handleFileChange(e, 'video')} className="w-full mt-1 p-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/40 text-sm text-brand-text-secondary bg-brand-bg rounded border border-white/20"/>
                    </div>
                </Card>

                {/* Preview */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Eye size={20}/> Preview</h2>
                    <Card className="p-6 text-center">
                        <h1 className="text-2xl font-bold text-white mb-4">{template.title}</h1>
                        {template.imageUrl && (
                            <div className="relative inline-block">
                                <img src={template.imageUrl} alt="Preview" className="my-4 rounded-lg max-h-40 mx-auto"/>
                                <button onClick={() => removeMedia('image')} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"><Trash2 size={12}/></button>
                            </div>
                        )}
                        {template.videoUrl && (
                             <div className="relative inline-block">
                                <video src={template.videoUrl} controls className="my-4 rounded-lg w-full max-w-xs mx-auto"/>
                                <button onClick={() => removeMedia('video')} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"><Trash2 size={12}/></button>
                            </div>
                        )}
                        <p className="text-brand-text-secondary max-w-md mx-auto mb-6 whitespace-pre-wrap">{template.text}</p>
                    </Card>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`px-6 py-3 bg-brand-primary text-brand-bg font-bold rounded-lg flex items-center gap-2 transition-transform ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                    <Save size={18}/> {isSaving ? 'Saving...' : 'Save Template'}
                </button>
                <AnimatePresence>
                {saveStatus && (
                    <motion.p initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-green-400">{saveStatus}</motion.p>
                )}
                {errorMessage && (
                    <motion.p initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-red-400 font-semibold">{errorMessage}</motion.p>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WelcomePageEditor;
