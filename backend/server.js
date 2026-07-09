require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình CORS để Frontend (port 5173 của Vite) có thể gọi API
app.use(cors());
app.use(express.json());

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
    
    const config = { responseType: 'arraybuffer' };
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
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${targetModel}`;
    
    // Add dimensions based on ratio
    if (ratio === '16:9') url += '&width=1024&height=576';
    else if (ratio === '9:16') url += '&width=576&height=1024';
    else url += '&width=1024&height=1024';

    // Add transparent flag
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
