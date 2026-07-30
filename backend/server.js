const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

// Serve output directory for local fallback images
app.use('/output', express.static(path.join(__dirname, 'output')));

// Helper Cloudinary fallback mechanism
// We upload to cloudinary in background. If it fails, we use local URL.
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'mindx_assets' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

const galleryFile = path.join(__dirname, 'output', 'gallery.json');
if (!fs.existsSync(path.join(__dirname, 'output'))) fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
if (!fs.existsSync(galleryFile)) fs.writeFileSync(galleryFile, '[]');

const saveToGallery = async (prompt, style, type, imageUrl) => {
  try {
    const data = JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
    const newItem = {
      id: Date.now().toString(),
      prompt,
      style: style || 'N/A',
      type,
      image_url: imageUrl,
      created_at: new Date().toISOString()
    };
    data.unshift(newItem);
    fs.writeFileSync(galleryFile, JSON.stringify(data, null, 2));
    console.log('Saved to gallery:', newItem.id);
  } catch (err) {
    console.error('Error saving to gallery:', err);
  }
};

app.get('/api/gallery', (req, res) => {
  try {
    if (!fs.existsSync(galleryFile)) return res.json([]);
    const data = JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi đọc thư viện' });
  }
});

// Common python runner
const runPythonCLI = (res, args, cleanupPath = null) => {
  const pythonScript = path.join(__dirname, 'ai_module', 'cli.py');
  
  let pythonExecutable;
  if (process.platform === 'win32') {
    pythonExecutable = path.join(__dirname, 'ai_module', 'venv', 'Scripts', 'python.exe');
  } else {
    const linuxVenvPath = path.join(__dirname, 'ai_module', 'venv', 'bin', 'python');
    pythonExecutable = fs.existsSync(linuxVenvPath) ? linuxVenvPath : 'python3';
  }
  
  execFile(pythonExecutable, [pythonScript, ...args], { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
    if (cleanupPath) {
      fs.unlink(cleanupPath, () => {});
    }
    
    if (error) {
      const errText = stderr || error.message || '';
      console.error('Python Error:', errText);
      
      let friendlyError = 'Lỗi AI module: ' + errText;
      if (errText.includes('429 Client Error') || errText.includes('Too Many Requests')) {
        friendlyError = 'Lỗi: Máy chủ AI đang quá tải hoặc API Key của bạn đã hết lượt/bị giới hạn. Vui lòng kiểm tra lại API Key hoặc thử lại sau.';
      } else if (errText.includes('402 Client Error') || errText.includes('Payment Required')) {
        friendlyError = 'Lỗi: API Key của bạn đã hết credits (Pollen). Vui lòng nạp thêm hoặc đổi Key mới.';
      } else if (errText.includes('401 Client Error') || errText.includes('Unauthorized')) {
        friendlyError = 'Lỗi: API Key không hợp lệ hoặc chưa được cấu hình đúng.';
      } else if (!stderr && error.message && error.message.includes('Command failed')) {
        friendlyError = 'Lỗi hệ thống: Máy chủ xử lý ảnh bị quá tải bộ nhớ (Out Of Memory). Lỗi này thường xảy ra khi Render bị cạn RAM. Vui lòng thử lại sau.';
      }
      
      return res.status(500).json({ error: friendlyError });
    }
    
    try {
      const jsonString = stdout.substring(stdout.indexOf('{'));
      const data = JSON.parse(jsonString);
      
      const filePath = data.file_path;
      const buffer = fs.readFileSync(filePath);
      const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
      const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
      
      // Upload to cloudinary async
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      uploadToCloudinary(buffer)
        .then(url => saveToGallery(data.prompt, args.includes('--style') ? args[args.indexOf('--style')+1] : '', data.asset_type, url))
        .catch(err => saveToGallery(data.prompt, '', data.asset_type, `${baseUrl}/${relativePath}`));

      res.json({ 
        image: dataUri, 
        file_path: relativePath, 
        metadata: { frames: data.frames || [] } 
      });
    } catch (parseError) {
      console.error('Parse Error:', parseError, stdout);
      res.status(500).json({ error: 'Lỗi xử lý JSON từ AI module' });
    }
  });
};

const getStyleMap = (style) => {
  const styleMap = {
    'Pixel Art': 'pixel_art',
    '3D Render': 'realistic',
    'Realistic': 'realistic',
    'Cartoon': 'cartoon',
    'Anime': 'cartoon',
    'Hand-drawn': 'cartoon',
    'Chibi': 'chibi',
    'Voxel': 'realistic',
    'Cyberpunk': 'pixel_art'
  };
  return styleMap[style] || 'pixel_art';
};

app.post('/api/generate-background', (req, res) => {
  const { subject, size_key, style, time_of_day, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });
  
  const outputDir = path.join(__dirname, 'output', 'backgrounds');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const args = ['background', subject, '--size', size_key, '--style', getStyleMap(style), '--time', time_of_day, '--seed', seed.toString(), '--out', outputDir];
  runPythonCLI(res, args);
});

app.post('/api/generate-sprite', (req, res) => {
  const { subject, size_key, style, perspective, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const outputDir = path.join(__dirname, 'output', 'sprites');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let command = 'sprite';
  if (style === 'Pixel Art' || subject.includes('block size')) command = 'pixel';

  const args = [command, subject, '--size', size_key, '--seed', seed.toString(), '--out', outputDir];
  if (command === 'sprite') {
    args.push('--style', getStyleMap(style));
    args.push('--facing', perspective === 'Front' ? 'front' : (perspective === 'Side' ? 'side' : (perspective === 'Back' ? 'back' : 'three-quarter')));
  }
  runPythonCLI(res, args);
});

app.post('/api/generate-tilesheet', (req, res) => {
  const { subject, action, frames, style, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const outputDir = path.join(__dirname, 'output', 'tilesheets');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Add --slice true so the python script returns the frame metadata properly mapped to x,y
  const args = ['tilesheet', subject, '--frames', frames.toString(), '--action', action, '--style', getStyleMap(style), '--seed', seed.toString(), '--slice', '--out', outputDir];
  runPythonCLI(res, args);
});

app.post('/api/generate-tileset', (req, res) => {
  const { subject, size_key, columns, style, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const outputDir = path.join(__dirname, 'output', 'tilesets');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tiles = subject.split(',').map(s => s.trim()).filter(s => s);
  const args = ['tileset', ...tiles, '--columns', columns.toString(), '--cell-size', size_key, '--style', getStyleMap(style), '--seed', seed.toString(), '--slice', '--out', outputDir];
  runPythonCLI(res, args);
});

app.post('/api/generate-from-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng upload ảnh!' });
  const { subject, command, style, size_key, block, colors } = req.body;
  
  const outputDir = path.join(__dirname, 'output', 'image_assets');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const imagePath = path.resolve(req.file.path);
  
  let actualCommand = command === 'pixel-from-image' ? 'pixel-from-image' : 'sprite-from-image';
  const args = [actualCommand, imagePath, '--size', size_key, '--out', outputDir];
  
  if (actualCommand === 'sprite-from-image') {
    args.push('--style', getStyleMap(style));
    if (subject) args.push('--extra', subject);
  } else {
    if (block) args.push('--block', block);
    if (colors) args.push('--colors', colors);
  }

  runPythonCLI(res, args, imagePath);
});

app.use('/output', express.static(path.join(__dirname, 'output')));

app.listen(PORT, () => {
  console.log(`Server Backend đang chạy trên cổng ${PORT}`);
});
