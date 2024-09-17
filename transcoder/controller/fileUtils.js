const fs = require('fs');
const path = require('path');

function createDirectoryIfNotExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

async function cleanupLocalFiles(filePaths) {
    const cleanupPromises = filePaths.map(filePath => {
        return new Promise((resolve, reject) => {
            fs.rm(filePath, { recursive: true, force: true }, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
    await Promise.all(cleanupPromises);
    console.log('Local files cleaned up successfully');
}

module.exports = { createDirectoryIfNotExists, cleanupLocalFiles };