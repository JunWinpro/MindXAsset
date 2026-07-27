const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'MindXAssets', 
  api_key: '582765611637422', 
  api_secret: 'xMfFGP2e4ei3pLN0SDmHPYOQPEY' 
});

cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', function(error, result) {
  if (error) {
    console.error('Upload Failed:', error);
  } else {
    console.log('Upload Succeeded:', result.secure_url);
  }
});
