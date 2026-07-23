require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Jimp, JimpMime } = require('jimp');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));

const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'MindXAssets', 
  api_key: '582765611637422', 
  api_secret: 'xMfFGP2e4ei3pLN0SDmHPYOQPEY' 
});

const galleryPath = path.join(__dirname, 'gallery.json');
if (!fs.existsSync(galleryPath)) {
  fs.writeFileSync(galleryPath, JSON.stringify([]));
}

// Hàm upload buffer lên Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'mindx_assets' },
      (error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Hàm lưu thông tin vào gallery.json
const saveToGallery = (prompt, style, type, imageUrl) => {
  try {
    const data = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
    const newItem = {
      id: Date.now().toString(),
      prompt,
      style,
      type,
      image_url: imageUrl,
      created_at: new Date().toISOString()
    };
    data.unshift(newItem); // Thêm lên đầu danh sách
    fs.writeFileSync(galleryPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving to gallery:', err);
  }
};

app.get('/api/gallery', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải thư viện' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  const { 
    prompt, 
    model = 'flux',
    assetType = '',
    artStyle = '',
    perspective = '',
    transparent = false,
    ratio = '1:1'
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Vui lòng cung cấp prompt.' });
  }

  try {
    const apiKey = process.env.POLLINATIONS_API_KEY ? process.env.POLLINATIONS_API_KEY.trim() : null;
    
    let finalPrompt = `${prompt}, ${assetType}, ${artStyle} style, ${perspective} perspective`;
    let targetModel = model;
    
    const config = { responseType: 'arraybuffer', timeout: 15000 }; // Đặt timeout 15 giây để chống treo web
    if (apiKey && apiKey !== 'sk_your_secret_key_here') {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
    }

    if (model === 'gemini') {
      try {
        const geminiInstruction = `Write a highly detailed English image generation prompt for a game asset. Idea: ${prompt}. It must be a ${assetType} in ${artStyle} style, from a ${perspective} perspective. Provide ONLY the prompt text, no intro/outro.`;
        const textUrl = `https://text.pollinations.ai/${encodeURIComponent(geminiInstruction)}`;
        const textConfig = apiKey && apiKey !== 'sk_your_secret_key_here' ? { headers: { 'Authorization': `Bearer ${apiKey}` } } : {};
        const textResponse = await axios.get(textUrl, textConfig);
        if (textResponse.data) {
          finalPrompt = textResponse.data;
          console.log('Gemini enhanced prompt:', finalPrompt);
        }
      } catch (err) {
        console.warn('Lỗi khi dùng Gemini tối ưu prompt:', err.message);
      }
      targetModel = 'flux';
    }

    const encodedPrompt = encodeURIComponent(finalPrompt);
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${targetModel}`;
    

    if (ratio === '16:9') url += '&width=1024&height=576';
    else if (ratio === '9:16') url += '&width=576&height=1024';
    else url += '&width=1024&height=1024';


    if (transparent) {
      url += '&transparent=true';
    }

    console.log('Fetching image from:', url);
    console.log('With config:', config);
    // Yêu cầu response trả về dạng arraybuffer để xử lý file nhị phân (ảnh)
    const response = await axios.get(url, config);

    // Chuyển đổi dữ liệu nhị phân sang chuỗi Base64
    const base64Image = Buffer.from(response.data).toString('base64');
    
    // Tạo data URI scheme để React có thể dùng ngay trong thẻ <img>
    const imageSrc = `data:image/jpeg;base64,${base64Image}`;

    // Upload lên Cloudinary
    uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', (process.env.RENDER ? 'https://mindxasset.onrender.com' : 'http://localhost:5000') + '/output/' + fallbackName); });

    res.json({ image: imageSrc });

  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Lỗi chi tiết từ Pollinations:', error.response.data.toString());
    } else {
      console.error('Lỗi khi tạo ảnh:', error.message);
    }

    // Xử lý các mã lỗi phổ biến theo yêu cầu
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        return res.status(401).json({ error: 'Theo bản cập nhật mới nhất, Pollinations API bắt buộc phải có API Key để tạo ảnh. Vui lòng lấy Key tại enter.pollinations.ai và cập nhật vào file .env (POLLINATIONS_API_KEY).' });
      }
      if (status === 402) {
         return res.status(402).json({ error: 'Payment Required: Tài khoản của bạn đã hết pollen.' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'Too Many Requests: Bạn đang tạo ảnh quá nhanh.' });
     }
      return res.status(status).json({ error: `Lỗi từ Pollinations API: ${error.response.statusText}` });
    }
    
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ. Không thể kết nối tới Pollinations.' });
  }
});

app.post('/api/generate-background', async (req, res) => {
  const {
    subject,
    size_key = 'background_hd',
    style = 'pixel_art',
    time_of_day = 'day',
    seed = -1,
    filename = ''
  } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Missing subject field' });
  }

  try {
    const apiKey = process.env.POLLINATIONS_API_KEY ? process.env.POLLINATIONS_API_KEY.trim() : null;
    
    // 1. Prompt Optimizer Logic
    let optimizedPrompt = subject;
    
    // Add time of day
    if (time_of_day && time_of_day !== 'day') {
      optimizedPrompt += `, ${time_of_day} time`;
    }
    
    // Add style
    if (style === 'pixel_art') {
      optimizedPrompt += `, pixel art style, 8-bit`;
    } else if (style) {
      optimizedPrompt += `, ${style.replace('_', ' ')} style`;
    }
    
    // Add negative prompt for background
    optimizedPrompt += `, pure background scenery, empty landscape, no subjects. Avoid: characters, people, animals, creatures, HUD, UI, text.`;
    
    const encodedPrompt = encodeURIComponent(optimizedPrompt);
    
    // 2. Resolution mapping
    let width = 1920;
    let height = 1080;
    
    if (size_key === 'background_sd') {
      width = 1280; height = 720;
    } else if (size_key === 'background_4k') {
      width = 3840; height = 2160;
    } else if (size_key === 'background_sq') {
      width = 1024; height = 1024;
    } else if (size_key && size_key.includes('x')) {
      const parts = size_key.toLowerCase().split('x');
      if (parts.length === 2) {
        const w = parseInt(parts[0], 10);
        const h = parseInt(parts[1], 10);
        if (!isNaN(w) && !isNaN(h)) {
          width = w;
          height = h;
        }
      }
    }
    
    // 3. API Call
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}`;
    if (seed !== -1) {
      url += `&seed=${seed}`;
    }
    
    const config = { responseType: 'arraybuffer', timeout: 30000 };
    if (apiKey && apiKey !== 'sk_your_secret_key_here') {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
      url += '&nologo=true';
    }
    
    console.log('Fetching AI Team Background from:', url);
    const response = await axios.get(url, config);
    
    // 4. Save image
    const outputDir = path.join(__dirname, 'output', 'backgrounds');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const actualFilename = filename || `bg_${Date.now()}_${size_key}.png`;
    const filePath = path.join(outputDir, actualFilename);
    const relativePath = `output/backgrounds/${actualFilename}`;
    
    fs.writeFileSync(filePath, response.data);

    uploadToCloudinary(Buffer.from(response.data))
      .then(url => {
        saveToGallery(optimizedPrompt, style || 'Unknown', 'Background', url);
      })
      .catch(err => {
        console.error('Cloudinary upload error:', err.message);
        saveToGallery(optimizedPrompt, style || 'Unknown', 'Background', 'http://localhost:5000/' + relativePath);
      });
    
    // 5. JSON Response
    const assetId = crypto.randomUUID();
    
    res.json({
      asset_id: assetId,
      asset_type: 'background',
      prompt: optimizedPrompt,
      provider: 'pollinations',
      model: 'flux',
      seed: seed === -1 ? Math.floor(Math.random() * 100000) : seed,
      width: width,
      height: height,
      format: 'png',
      file_path: relativePath,
      has_alpha: false,
      frames: [],
      warnings: []
    });

  } catch (error) {
    console.error('Error generating background:', error.message);
    res.status(500).json({ error: 'Lỗi khi tạo background (AI Team Spec)' });
  }
});

app.post('/api/generate-sprite', async (req, res) => {
  const { subject, size_key = '64x64', seed = -1, filename = '', style = 'Pixel Art', perspective = 'Isometric' } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  try {
    const apiKey = process.env.POLLINATIONS_API_KEY ? process.env.POLLINATIONS_API_KEY.trim() : null;
    let optimizedPrompt = `${subject}, ${perspective} perspective, ${style} style, character or item, solid black outline, flat colors`;
    const encodedPrompt = encodeURIComponent(optimizedPrompt);

    let width = 512; let height = 512;
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}&transparent=true`;
    if (seed !== -1) url += `&seed=${seed}`;

    const config = { responseType: 'arraybuffer', timeout: 30000 };
    if (apiKey && apiKey !== 'sk_your_secret_key_here') {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
      url += '&nologo=true';
    }

    const response = await axios.get(url, config);
    const base64Image = Buffer.from(response.data).toString('base64');
    const imageSrc = `data:image/png;base64,${base64Image}`;
    
    const outputDir = path.join(__dirname, 'output', 'sprites');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const actualFilename = filename || `sprite_${Date.now()}.png`;
    fs.writeFileSync(path.join(outputDir, actualFilename), response.data);

    uploadToCloudinary(Buffer.from(response.data))
      .then(url => {
        saveToGallery(subject, style || 'Unknown', 'Character', url);
      })
      .catch(err => {
        console.error('Cloudinary upload error:', err.message);
        saveToGallery(subject, style || 'Unknown', 'Character', `http://localhost:5000/output/sprites/${actualFilename}`);
      });

    res.json({ image: imageSrc, file_path: `output/sprites/${actualFilename}` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo sprite.' });
  }
});

app.post('/api/generate-tilesheet', async (req, res) => {
  const { subject, action = 'running', frames = 10, seed = -1, style = 'Pixel Art', perspective = 'Isometric' } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  try {
    const apiKey = process.env.POLLINATIONS_API_KEY ? process.env.POLLINATIONS_API_KEY.trim() : null;
    let optimizedPrompt = `A perfectly aligned horizontal sprite sheet of ${frames} frames showing a ${action} animation cycle of ${subject}. ${perspective} perspective, ${style} style, character design, flat solid white background, no grid lines, no overlaps.`;
    const encodedPrompt = encodeURIComponent(optimizedPrompt);

    // Dùng 1024x256 (4:1) để không bị kéo giãn (stretching)
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=256`;
    if (seed !== -1) url += `&seed=${seed}`;

    const config = { responseType: 'arraybuffer', timeout: 30000 };
    if (apiKey && apiKey !== 'sk_your_secret_key_here') {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
      url += '&nologo=true';
    }

    const response = await axios.get(url, config);
    const base64Image = Buffer.from(response.data).toString('base64');
    const imageSrc = `data:image/png;base64,${base64Image}`;

    const outputDir = path.join(__dirname, 'output', 'tilesheets');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const timestamp = Date.now();
    const actualFilename = `tilesheet_${timestamp}.png`;
    const zipFilename = `tilesheet_pack_${timestamp}.zip`;
    
    const fullSheetPath = path.join(outputDir, actualFilename);
    fs.writeFileSync(fullSheetPath, response.data);

    const zip = new AdmZip();
    zip.addLocalFile(fullSheetPath);

    // Upload lên Cloudinary
    uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', (process.env.RENDER ? 'https://mindxasset.onrender.com' : 'http://localhost:5000') + '/output/' + fallbackName); });

    // Upload nền lên Cloudinary
    uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', (process.env.RENDER ? 'https://mindxasset.onrender.com' : 'http://localhost:5000') + '/output/' + fallbackName); });

    try {
      const image = await Jimp.read(Buffer.from(response.data));
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const frameWidth = Math.floor(width / frames);

      for (let i = 0; i < frames; i++) {
        const frameImg = image.clone().crop({ x: i * frameWidth, y: 0, w: frameWidth, h: height });
        const frameBuffer = await frameImg.getBuffer(JimpMime.png);
        zip.addFile(`frame_${i + 1}.png`, frameBuffer);
      }
      zip.writeZip(path.join(outputDir, zipFilename));
      console.log(`Successfully sliced tilesheet into ${frames} frames.`);
    } catch (sliceErr) {
      console.error('Error slicing tilesheet:', sliceErr);
    }

    res.json({ 
      image: imageSrc, 
      file_path: `output/tilesheets/${actualFilename}`,
      zip_url: `output/tilesheets/${zipFilename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo tilesheet.' });
  }
});

app.post('/api/generate-tileset', async (req, res) => {
  const { subject, size_key = '32x32', columns = 8, seed = -1, style = 'Pixel Art', perspective = 'Isometric' } = req.body;
  if (!subject) return res.status(400).json({ error: 'Missing subject field' });

  try {
    const apiKey = process.env.POLLINATIONS_API_KEY ? process.env.POLLINATIONS_API_KEY.trim() : null;
    let optimizedPrompt = `2D game tileset, ${subject} environment, seamless tiles, grid layout, ${style} style, ${perspective} perspective`;
    const encodedPrompt = encodeURIComponent(optimizedPrompt);

    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024`;
    if (seed !== -1) url += `&seed=${seed}`;

    const config = { responseType: 'arraybuffer', timeout: 30000 };
    if (apiKey && apiKey !== 'sk_your_secret_key_here') {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
      url += '&nologo=true';
    }

    const response = await axios.get(url, config);
    const base64Image = Buffer.from(response.data).toString('base64');
    const imageSrc = `data:image/png;base64,${base64Image}`;

    const outputDir = path.join(__dirname, 'output', 'tilesets');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const timestamp = Date.now();
    const actualFilename = `tileset_${timestamp}.png`;
    const zipFilename = `tileset_pack_${timestamp}.zip`;
    
    const fullSheetPath = path.join(outputDir, actualFilename);
    fs.writeFileSync(fullSheetPath, response.data);
    
    // Upload nền lên Cloudinary
    uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', (process.env.RENDER ? 'https://mindxasset.onrender.com' : 'http://localhost:5000') + '/output/' + fallbackName); });
    
    const tileWidth = parseInt(size_key.split('x')[0]) || 32;
    const tileHeight = parseInt(size_key.split('x')[1]) || 32;

    const layoutConfig = {
      tile_width: tileWidth,
      tile_height: tileHeight,
      columns: columns,
      margin: 0,
      spacing: 0,
      tiles: []
    };

    const zip = new AdmZip();
    zip.addLocalFile(fullSheetPath);

    // Upload lên Cloudinary
    uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', (process.env.RENDER ? 'https://mindxasset.onrender.com' : 'http://localhost:5000') + '/output/' + fallbackName); });
    
    try {
      const image = await Jimp.read(Buffer.from(response.data));
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      
      const rows = Math.floor(height / tileHeight);
      const cols = Math.floor(width / tileWidth);
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tileImg = image.clone().crop({ x: c * tileWidth, y: r * tileHeight, w: tileWidth, h: tileHeight });
          const tileBuffer = await tileImg.getBuffer(JimpMime.png);
          const tileName = `tile_${r}_${c}.png`;
          
          zip.addFile(tileName, tileBuffer);
          
          layoutConfig.tiles.push({
            id: r * cols + c,
            name: tileName,
            x: c * tileWidth,
            y: r * tileHeight
          });
        }
      }
      console.log(`Successfully sliced tileset into ${rows * cols} tiles.`);
    } catch (sliceErr) {
      console.error('Error slicing tileset:', sliceErr);
    }
    
    const jsonFilename = `tileset_${timestamp}.json`;
    const jsonString = JSON.stringify(layoutConfig, null, 2);
    
    fs.writeFileSync(path.join(outputDir, jsonFilename), jsonString);
    zip.addFile(jsonFilename, Buffer.from(jsonString, 'utf8'));
    
    zip.writeZip(path.join(outputDir, zipFilename));

    res.json({ 
      image: imageSrc, 
      file_path: `output/tilesets/${actualFilename}`, 
      json_path: `output/tilesets/${jsonFilename}`,
      zip_url: `output/tilesets/${zipFilename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo tileset.' });
  }
});

app.post('/api/generate-image-hf', async (req, res) => {
  const { 
    prompt,
    assetType = '',
    artStyle = '',
    perspective = ''
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Vui lòng cung cấp prompt.' });
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Chưa cấu hình HUGGINGFACE_API_KEY trong file .env' });
  }

  let finalPrompt = `${prompt}, ${assetType}, ${artStyle} style, ${perspective} perspective`;

  try {
    const url = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
    
    console.log('Đang gọi Hugging Face API với prompt:', finalPrompt);
    const response = await axios.post(
      url,
      { inputs: finalPrompt },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const base64Image = Buffer.from(response.data).toString('base64');
    const imageSrc = `data:image/jpeg;base64,${base64Image}`;

    res.json({ image: imageSrc });

  } catch (error) {
    console.error('Lỗi khi gọi Hugging Face:', error.message);
    res.status(500).json({ error: 'Lỗi khi tạo ảnh với Hugging Face API.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});
