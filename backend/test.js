const axios = require('axios');

axios.post('http://localhost:5000/api/generate-image', {
  prompt: 'cat',
  model: 'flux'
})
.then(res => {
  console.log('Success, image length:', res.data.image.length);
  console.log(res.data.image.substring(0, 50));
})
.catch(err => {
  console.error('Error:', err.response ? err.response.data : err.message);
});
