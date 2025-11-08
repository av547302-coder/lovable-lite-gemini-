const fs = require('fs');
const ftp = require('ftp');

exports.uploadToFTP = (filePath, fileName) => {
  return new Promise((resolve, reject) => {
    const client = new ftp();

    client.on('ready', () => {
      client.put(filePath, `${process.env.FTP_DIR}/${fileName}`, (err) => {
        if (err) return reject(err);
        client.end();
        console.log("Uploaded successfully ✅");
        resolve(true);
      });
    });

    client.on('error', reject);

    client.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS
    });
  });
};
