import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

app.use((req, res, next) => {
  req.setTimeout(600000);
  res.setTimeout(600000);
  next();
});

const STORAGE_DIR = path.join(__dirname, 'storage');
const USERS_FILE = path.join(STORAGE_DIR, 'users.json');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'settings.json');
const MESSAGES_FILE = path.join(STORAGE_DIR, 'messages.json');

const ensureStorageExists = async () => {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'inbox_media'), { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'media'), { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'media', 'welcome_page'), { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'media', 'welcome_inbox'), { recursive: true });
  }
};

const readJSONFile = async (filePath, defaultValue = []) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJSONFile(filePath, defaultValue);
      return defaultValue;
    }
    throw error;
  }
};

const writeJSONFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
};

app.get('/api/storage/users', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/users/:userId', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    const user = users.find(u => u.id === req.params.userId);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error reading user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/users/:userId', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === req.params.userId);
    
    if (userIndex >= 0) {
      users[userIndex] = req.body;
    } else {
      users.push(req.body);
    }
    
    await writeJSONFile(USERS_FILE, users);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/storage/users/:userId', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    const filteredUsers = users.filter(u => u.id !== req.params.userId);
    await writeJSONFile(USERS_FILE, filteredUsers);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/settings', async (req, res) => {
  try {
    const defaultSettings = {
      systemSettings: {
        recaptchaEnabled: false,
        recaptchaSiteKey: "",
        recaptchaSecretKey: ""
      },
      walletConfig: {},
      welcomePageTemplate: {},
      welcomeInboxTemplate: {},
      chatbotSettings: {},
      testimonials: []
    };
    const settings = await readJSONFile(SETTINGS_FILE, defaultSettings);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/settings', async (req, res) => {
  try {
    await writeJSONFile(SETTINGS_FILE, req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/messages', async (req, res) => {
  try {
    const messages = await readJSONFile(MESSAGES_FILE, []);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/messages', async (req, res) => {
  try {
    await writeJSONFile(MESSAGES_FILE, req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error saving messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/upload-media', async (req, res) => {
  try {
    const { type, mediaType, data } = req.body;
    
    if (!type || !mediaType || !data) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: type, mediaType, data' 
      });
    }

    if (!['welcome_page', 'welcome_inbox'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid type. Must be welcome_page or welcome_inbox' 
      });
    }

    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mediaType. Must be image or video' 
      });
    }

    const base64Match = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!base64Match) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid base64 data format' 
      });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const maxSizeMB = 100;
    const sizeMB = buffer.length / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      return res.status(400).json({ 
        success: false, 
        message: `File too large. Maximum size is ${maxSizeMB}MB. Your file is ${sizeMB.toFixed(1)}MB.` 
      });
    }
    
    const extension = mimeType.split('/')[1].split('+')[0];
    const filename = `${mediaType}_${Date.now()}.${extension}`;
    const mediaDir = path.join(STORAGE_DIR, 'media', type);
    const filePath = path.join(mediaDir, filename);
    
    await fs.writeFile(filePath, buffer);
    
    console.log(`✅ Media file saved: ${filename} (${sizeMB.toFixed(2)}MB)`);
    
    try {
      const files = await fs.readdir(mediaDir);
      const oldFiles = files.filter(f => f.startsWith(`${mediaType}_`) && f !== filename);
      
      for (const oldFile of oldFiles) {
        try {
          await fs.unlink(path.join(mediaDir, oldFile));
          console.log(`🗑️  Deleted old media: ${oldFile}`);
        } catch (err) {
          console.error(`Failed to delete old media ${oldFile}:`, err);
        }
      }
    } catch (err) {
      console.log('No old files to clean up');
    }
    
    const fileUrl = `/api/storage/media/${type}/${filename}`;
    res.json({ success: true, url: fileUrl, filename });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/media/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    if (!['welcome_page', 'welcome_inbox'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid type' 
      });
    }

    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid filename' 
      });
    }

    const mediaDir = path.join(STORAGE_DIR, 'media', type);
    const filePath = path.join(mediaDir, filename);
    const resolvedPath = path.resolve(filePath);
    const resolvedMediaDir = path.resolve(mediaDir);
    
    if (!resolvedPath.startsWith(resolvedMediaDir)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    try {
      await fs.access(filePath);
      res.sendFile(filePath);
    } catch {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error('⚠️ EMAIL_USER and EMAIL_APP_PASSWORD environment variables must be set!');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const createVerificationEmailHTML = (code) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your TradePilot AI Verification Code</title>
      <style>
          body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0a0a1a; color: #e0e0e0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); }
          .header { padding: 40px; text-align: center; background: linear-gradient(45deg, #00f5ff, #e040fb); color: #0a0a1a; }
          .header-logo { width: 60px; height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px; }
          .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; }
          .code-container { text-align: center; margin: 30px 0; }
          .code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #00f5ff; background-color: #0a0a1a; padding: 15px 30px; border-radius: 8px; border: 1px dashed #00f5ff; display: inline-block; }
          .expiry-note { font-size: 14px; color: #a0a0b0; text-align: center; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #a0a0b0; border-top: 1px solid rgba(255, 255, 255, 0.1); }
          .footer a { color: #00f5ff; text-decoration: none; }
      </style>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
      <div class="container">
          <div class="header">
               <img src="https://i.imgur.com/uN19t3y.png" alt="TradePilot AI Logo" class="header-logo">
              <h1>Welcome to TradePilot AI</h1>
          </div>
          <div class="content">
              <p>Your crypto automation hub awaits. Please use the verification code below to complete your registration.</p>
              <div class="code-container">
                  <span class="code">${code}</span>
              </div>
              <p class="expiry-note">This code will expire in 5 minutes.</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TradePilot AI. All Rights Reserved.<br>
              If you have any questions, contact our support team at <a href="mailto:support@tradepilot.ai">support@tradepilot.ai</a></p>
          </div>
      </div>
  </body>
  </html>
  `;
};

app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.' 
      });
    }

    const mailOptions = {
      from: `TradePilot AI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your TradePilot AI Verification Code',
      html: createVerificationEmailHTML(code),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);
    
    res.json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification email',
      error: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
  res.json({ 
    status: 'ok', 
    emailConfigured: hasCredentials,
    message: hasCredentials 
      ? 'Email service is configured and ready' 
      : 'Email service needs EMAIL_USER and EMAIL_APP_PASSWORD to be set'
  });
});

ensureStorageExists().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`💾 File storage: ${STORAGE_DIR}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured ✅' : 'Not configured ⚠️'}`);
  });
}).catch(error => {
  console.error('Failed to initialize storage:', error);
  process.exit(1);
});
