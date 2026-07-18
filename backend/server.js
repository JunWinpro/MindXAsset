require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));

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
