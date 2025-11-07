require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const archiver = require('archiver');
const fs = require('fs');
const { generateWebsite } = require('./lib/generateGemini');
const { uploadToFTP } = require('./lib/ftpUpload');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static('public'));

// Basic Auth
const BASIC_USER = process.env.BASIC_AUTH_USER;
const BASIC_PASS = process.env.BASIC_AUTH_PASS;

app.use((req, res, next) => {
  const b64 = (req.headers.authorization || '').split(' ')[1] || '';
  const [u, p] = Buffer.from(b64, 'base64').toString().split(':');
  if (u === BASIC_USER && p === BASIC_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="Studio"');
  return res.status(401).send('Auth required');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    // 1. Generate code using Google Gemini API
    const files = await generateWebsite(prompt);
    const zipName = `website-${Date.now()}.zip`;
    const zipPath = path.join(__dirname, zipName);

    // 2. Create ZIP file
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip');
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      for (const [filePath, content] of Object.entries(files)) {
        archive.append(content, { name: filePath });
      }
      archive.finalize();
    });

    // 3. Upload to Hostinger FTP
    await uploadToFTP(zipPath, zipName);

    // 4. Send response with download option
    res.render('done', {
      zipName
    });

    // cleanup
    fs.unlinkSync(zipPath);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating website: " + err.message);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
