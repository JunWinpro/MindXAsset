const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldStr = `uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => console.error('Cloudinary upload error:', err));`;

const newStr = `uploadToCloudinary(Buffer.from(response.data)).then(url => { const cPrompt = typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'); const cStyle = typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'); const cType = typeof assetType !== 'undefined' ? assetType : 'Asset'; saveToGallery(cPrompt, cStyle, cType, url); }).catch(err => { console.error('Cloudinary upload error:', err.message); const fallbackName = 'fallback_' + Date.now() + '.png'; const fallbackPath = require('path').join(__dirname, 'output', fallbackName); fs.writeFileSync(fallbackPath, Buffer.from(response.data)); saveToGallery(typeof prompt !== 'undefined' ? prompt : (typeof subject !== 'undefined' ? subject : 'Asset'), typeof style !== 'undefined' ? style : (typeof artStyle !== 'undefined' ? artStyle : 'Unknown'), typeof assetType !== 'undefined' ? assetType : 'Asset', 'http://localhost:5000/output/' + fallbackName); });`;

code = code.split(oldStr).join(newStr);
fs.writeFileSync('server.js', code);
console.log('Fixed server.js');
