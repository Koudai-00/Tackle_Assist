const fs = require('fs');
const path = require('path');

const TARGET = "const baseUrl = Platform.OS === 'web' ? '' : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081'}`;";
const REPLACEMENT = "const baseUrl = require('../../utils/api').getBaseUrl();"; // Adjust per file depth

function processFile(filePath) {
    const contents = fs.readFileSync(filePath, 'utf8');
    if (!contents.includes(TARGET)) return;
    
    // Calculate relative path to utils/api
    const relative = path.relative(path.dirname(filePath), path.join(__dirname, '../utils/api'));
    const relativeRequire = relative.replace(/\\/g, '/');
    let replacement = `import { getBaseUrl } from '${relativeRequire.startsWith('.') ? relativeRequire : './' + relativeRequire}';\n`;
    
    // Quick fix: Since we might add import at the top incorrectly, let's just do an inline require where the baseUrl is needed:
    // Alternatively, just inject a dynamic require.
    const inlineReplacement = `const baseUrl = require('${relativeRequire}').getBaseUrl();`;

    const newContents = contents.replaceAll(TARGET, inlineReplacement);
    fs.writeFileSync(filePath, newContents, 'utf8');
    console.log('Fixed', filePath);
}

function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

scanDir(path.join(__dirname, 'app'));
scanDir(path.join(__dirname, 'hooks'));
