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
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/users/:userId', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    const user = users.find(u => u.id === req.params.userId);
    if (user) res.json({ success: true, data: user });
    else res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/users/:userId', async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE, []);
    const userIndex = users.findIndex(u => u.id === req.params.userId);
    if (userIndex >= 0) users[userIndex] = req.body;
    else users.push(req.body);
    
    await writeJSONFile(USERS_FILE, users);
    res.json({ success: true, data: req.body });
  } catch (error) {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/settings', async (req, res) => {
  try {
    await writeJSONFile(SETTINGS_FILE, req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/storage/messages', async (req, res) => {
  try {
    const messages = await readJSONFile(MESSAGES_FILE, []);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/storage/messages', async (req, res) => {
  try {
    await writeJSONFile(MESSAGES_FILE, req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Email setup
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass }
  });
};

const createVerificationEmailHTML = (code) => `
<!DOCTYPE html>
<html>
<body>
<h1>Your verification code</h1>
<h2>${code}</h2>
</body>
</html>
`;

app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const transporter = createTransporter();
    if (!transporter) return res.status(500).json({ success: false });

    const mailOptions = {
      from: `TradePilot AI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verification Code',
      html: createVerificationEmailHTML(code),
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  const ok = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
  res.json({ status: 'ok', emailConfigured: ok });
});

// ======== RENDER.COM FRONTEND DEPLOY FIX ========
// Serve Vite build output
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server after storage init
ensureStorageExists().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server live on port ${PORT}`);
    console.log(`💾 Storage OK at ${STORAGE_DIR}`);
  });
}).catch(err => {
  console.error("Storage init failed:", err);
  process.exit(1);
});
