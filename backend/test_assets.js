const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/generate-image', {
      prompt: 'a majestic dragon',
      model: 'flux',
      assetType: 'Character',
      artStyle: 'Pixel Art',
      perspective: 'Isometric',
      transparent: true,
      ratio: '16:9'
    });
    console.log('Success, image length:', res.data.image.length);
  } catch (err) {
    if (err.response) {
      console.error('Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}
test();
