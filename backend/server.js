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

// Ensure uploads and output directories exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const baseOutputDir = path.join(__dirname, 'output');
if (!fs.existsSync(baseOutputDir)) fs.mkdirSync(baseOutputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per SRS
});

// Serve output directory for local fallback images
app.use('/output', express.static(baseOutputDir));

// Helper Cloudinary fallback mechanism
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(new Error('Cloudinary credentials not configured'));
    }
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

const galleryFile = path.join(baseOutputDir, 'gallery.json');
if (!fs.existsSync(galleryFile)) fs.writeFileSync(galleryFile, '[]');

const saveToGallery = async (prompt, style, type, imageUrl) => {
  try {
    let data = [];
    if (fs.existsSync(galleryFile)) {
      const content = fs.readFileSync(galleryFile, 'utf8').trim();
      data = content ? JSON.parse(content) : [];
    }
    const newItem = {
      id: Date.now().toString(),
      prompt: prompt || 'Game Asset',
      style: style || 'Pixel Art',
      type: type || 'Asset',
      image_url: imageUrl,
      created_at: new Date().toISOString()
    };
    data.unshift(newItem);
    fs.writeFileSync(galleryFile, JSON.stringify(data, null, 2));
    console.log('Saved to gallery:', newItem.id);
  } catch (err) {
    console.error('Error saving to gallery:', err.message);
  }
};

app.get('/api/gallery', (req, res) => {
  try {
    if (!fs.existsSync(galleryFile)) return res.json([]);
    const content = fs.readFileSync(galleryFile, 'utf8').trim();
    const data = content ? JSON.parse(content) : [];
    res.json(data);
  } catch (err) {
    console.error('Lỗi khi đọc gallery:', err.message);
    res.status(500).json({ error: 'Lỗi khi đọc thư viện ảnh' });
  }
});

// Common python runner
const runPythonCLI = (res, args, cleanupPath = null) => {
  const pythonScript = path.join(__dirname, 'ai_module', 'cli.py');
  
  let pythonExecutable;
  if (process.platform === 'win32') {
    const winVenv = path.join(__dirname, 'ai_module', 'venv', 'Scripts', 'python.exe');
    pythonExecutable = fs.existsSync(winVenv) ? winVenv : 'python';
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
        friendlyError = 'Lỗi: Máy chủ AI đang quá tải hoặc API Key đã hết lượt/bị giới hạn. Vui lòng kiểm tra lại API Key hoặc thử lại sau.';
      } else if (errText.includes('402 Client Error') || errText.includes('Payment Required')) {
        friendlyError = 'Lỗi: API Key của bạn đã hết credits (Pollen). Vui lòng nạp thêm hoặc đổi Key mới.';
      } else if (errText.includes('401 Client Error') || errText.includes('Unauthorized')) {
        friendlyError = 'Lỗi: API Key không hợp lệ hoặc chưa được cấu hình đúng trong .env.';
      } else if (!stderr && error.message && error.message.includes('Command failed')) {
        friendlyError = 'Lỗi hệ thống: Máy chủ xử lý ảnh bị quá tải bộ nhớ. Vui lòng thử lại.';
      }
      
      return res.status(500).json({ error: friendlyError });
    }
    
    try {
      const firstBrace = stdout.indexOf('{');
      if (firstBrace === -1) {
        throw new Error('AI Engine không trả về dữ liệu JSON hợp lệ');
      }
      const jsonString = stdout.substring(firstBrace);
      const data = JSON.parse(jsonString);
      
      const filePath = data.file_path;
      if (!fs.existsSync(filePath)) {
        throw new Error('File ảnh được tạo không tồn tại trên ổ đĩa: ' + filePath);
      }
      const buffer = fs.readFileSync(filePath);
      const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
      const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
      
      // Calculate full metadata for Frontend slicer & preview
      let totalFrames = 1;
      let layoutFormat = 'single';
      let frameWidth = data.width || 64;
      let frameHeight = data.height || 64;
      let cols = 1;
      let rows = 1;

      if (Array.isArray(data.frames) && data.frames.length > 0) {
        totalFrames = data.frames.length;
        frameWidth = data.frames[0].w || frameWidth;
        frameHeight = data.frames[0].h || frameHeight;
        const distinctX = new Set(data.frames.map(f => f.x));
        const distinctY = new Set(data.frames.map(f => f.y));
        cols = distinctX.size || 1;
        rows = distinctY.size || 1;
        layoutFormat = rows <= 1 ? 'horizontal' : 'grid';
      }

      const fullMetadata = {
        total_frames: totalFrames,
        layout_format: layoutFormat,
        frame_width: frameWidth,
        frame_height: frameHeight,
        columns: cols,
        rows: rows,
        frames: data.frames || []
      };

      const resolvedStyle = args.includes('--style') ? args[args.indexOf('--style') + 1] : 'Pixel Art';
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

      // Upload to cloudinary async with fallback to local path
      uploadToCloudinary(buffer)
        .then(url => saveToGallery(data.prompt, resolvedStyle, data.asset_type, url))
        .catch(() => saveToGallery(data.prompt, resolvedStyle, data.asset_type, `${baseUrl}/${relativePath}`));

      res.json({ 
        image: dataUri, 
        file_path: relativePath, 
        metadata: fullMetadata
      });
    } catch (parseError) {
      console.error('Parse Error:', parseError.message, stdout);
      res.status(500).json({ error: 'Lỗi xử lý JSON từ AI module: ' + parseError.message });
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

  const safeSizeKey = size_key || 'background_hd';
  const safeTime = time_of_day || 'day';
  const safeSeed = (seed ?? -1).toString();

  const args = [
    'background', subject,
    '--size', safeSizeKey,
    '--style', getStyleMap(style),
    '--time', safeTime,
    '--seed', safeSeed,
    '--out', baseOutputDir
  ];
  runPythonCLI(res, args);
});

app.post('/api/generate-sprite', (req, res) => {
  const { subject, size_key, style, perspective, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const safeSizeKey = size_key || 'sprite_medium';
  const safeSeed = (seed ?? -1).toString();

  let command = 'sprite';
  if (style === 'Pixel Art' || subject.includes('block size')) command = 'pixel';

  const args = [command, subject, '--size', safeSizeKey, '--seed', safeSeed, '--out', baseOutputDir];
  if (command === 'sprite') {
    args.push('--style', getStyleMap(style));
    args.push('--facing', perspective === 'Front' ? 'front' : (perspective === 'Side' ? 'side' : (perspective === 'Back' ? 'back' : 'three-quarter')));
  }
  runPythonCLI(res, args);
});

app.post('/api/generate-tilesheet', (req, res) => {
  const { subject, action, frames, style, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const safeFrames = (frames ?? 10).toString();
  const safeAction = action || 'running';
  const safeSeed = (seed ?? -1).toString();

  const args = [
    'tilesheet', subject,
    '--frames', safeFrames,
    '--action', safeAction,
    '--style', getStyleMap(style),
    '--seed', safeSeed,
    '--slice',
    '--out', baseOutputDir
  ];
  runPythonCLI(res, args);
});

app.post('/api/generate-tileset', (req, res) => {
  const { subject, size_key, columns, style, seed } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  const safeColumns = (columns ?? 8).toString();
  const safeCellSize = size_key || 'tile_32';
  const safeSeed = (seed ?? -1).toString();

  const tiles = subject.split(',').map(s => s.trim()).filter(s => s);
  const args = [
    'tileset', ...tiles,
    '--columns', safeColumns,
    '--cell-size', safeCellSize,
    '--style', getStyleMap(style),
    '--seed', safeSeed,
    '--slice',
    '--out', baseOutputDir
  ];
  runPythonCLI(res, args);
});

app.post('/api/generate-from-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng upload ảnh!' });
  const { subject, command, style, size_key, block, colors } = req.body;
  const imagePath = path.resolve(req.file.path);

  try {
    const safeSizeKey = size_key || 'sprite_medium';
    const actualCommand = command === 'pixel-from-image' ? 'pixel-from-image' : 'sprite-from-image';
    const args = [actualCommand, imagePath, '--size', safeSizeKey, '--out', baseOutputDir];

    if (actualCommand === 'sprite-from-image') {
      args.push('--style', getStyleMap(style));
      if (subject) args.push('--extra', subject);
    } else {
      if (block) args.push('--block', block.toString());
      if (colors) args.push('--colors', colors.toString());
    }

    runPythonCLI(res, args, imagePath);
  } catch (err) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    console.error('Error in generate-from-image:', err);
    res.status(500).json({ error: 'Lỗi chuẩn bị dữ liệu xử lý ảnh: ' + err.message });
  }
});

// Legacy / Test compatibility endpoint for test.js & test_assets.js
app.post('/api/generate-image', (req, res) => {
  const { prompt, subject, style, artStyle, assetType, size_key } = req.body;
  const targetSubject = prompt || subject || 'game asset';
  const targetStyle = style || artStyle || 'Pixel Art';
  const targetType = (assetType || '').toLowerCase();

  if (targetType.includes('background') || targetType.includes('scenery')) {
    const args = [
      'background', targetSubject,
      '--size', size_key || 'background_hd',
      '--style', getStyleMap(targetStyle),
      '--out', baseOutputDir
    ];
    return runPythonCLI(res, args);
  }

  const args = [
    'sprite', targetSubject,
    '--size', size_key || 'sprite_medium',
    '--style', getStyleMap(targetStyle),
    '--out', baseOutputDir
  ];
  runPythonCLI(res, args);
});

// New Endpoint for Character Customizer (Phase 1 Mock / Forwarder)
app.post('/api/generate-custom-character', (req, res) => {
  const { config, action, export_format, resolution } = req.body;
  
  if (!config || !config.base_id) {
    return res.status(400).json({ error: 'Missing character config' });
  }

  console.log("Nhận yêu cầu xuất Form Output:", req.body);
  
  // TO DO cho AI Team: 
  // Thay thế block mock này bằng code gọi Python Model thực tế nhận JSON payload.
  // Hiện tại tạm thời giả lập độ trễ AI 2s và trả về ảnh placeholder hoặc gọi AI sinh ảnh chung chung.
  
  const targetSubject = `A pixel art character with ${config.hair_id}, ${config.outfit_id}, performing ${action} action`;
  
  const args = [
    'sprite', targetSubject,
    '--size', 'sprite_medium',
    '--style', 'pixel_art',
    '--out', baseOutputDir
  ];
  
  runPythonCLI(res, args);
});


app.listen(PORT, () => {
  console.log(`Server Backend MindX Asset Generator đang chạy trên cổng ${PORT}`);
});
