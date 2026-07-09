const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/generate-image', {
      prompt: 'a beautiful cat',
      model: 'gemini'
    });
    console.log('Success, image length:', res.data.image.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
