const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    const contents = fs.readFileSync(filePath, 'utf8');
    const newContents = contents.replace(/const baseUrl = require\(['"].*?['"]\)\.getBaseUrl\(\);/g, "const baseUrl = require('@/utils/api').getBaseUrl();");
    
    if (newContents !== contents) {
        fs.writeFileSync(filePath, newContents, 'utf8');
        console.log('Fixed', filePath);
    }
}

function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            processFile(fullPath);
        }
    }
}

scanDir(path.join(__dirname, 'app'));
scanDir(path.join(__dirname, 'hooks'));
