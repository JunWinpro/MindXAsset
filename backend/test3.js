const axios = require('axios');

async function test() {
  try {
    const url = 'https://image.pollinations.ai/prompt/a%20beautiful%20cat?model=flux';
    console.log('Fetching:', url);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Success, image length:', response.data.length);
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data.toString());
    } else {
      console.error('Error:', error.message);
    }
  }
}
test();
