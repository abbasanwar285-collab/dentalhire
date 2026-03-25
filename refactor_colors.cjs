const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { regex: /text-\[#1D1D1F\]/g, replacement: 'text-apple-text' },
    { regex: /text-\[#86868B\]/g, replacement: 'text-apple-text-secondary' },
    { regex: /text-\[#AEAEB2\]/g, replacement: 'text-apple-text-tertiary' },
    { regex: /bg-\[#F5F5F7\]/g, replacement: 'bg-apple-bg' },
    { regex: /bg-\[#FFFFFF\]/g, replacement: 'bg-apple-card' },
    { regex: /bg-white/g, replacement: 'bg-apple-card' },
    { regex: /bg-\[rgba\(120,120,128,0\.04\)\]/g, replacement: 'bg-apple-fill' },
    { regex: /bg-\[rgba\(120,120,128,0\.08\)\]/g, replacement: 'bg-apple-fill' },  // merging fills
    { regex: /bg-\[rgba\(120,120,128,0\.12\)\]/g, replacement: 'bg-apple-fill-secondary' },
    { regex: /border-\[rgba\(60,60,67,0\.06\)\]/g, replacement: 'border-apple-separator' },
    { regex: /border-\[rgba\(60,60,67,0\.08\)\]/g, replacement: 'border-apple-separator' },
    { regex: /border-\[rgba\(60,60,67,0\.1\)\]/g, replacement: 'border-apple-separator' },
    // For arbitrary text colors that are close to apple text
    { regex: /text-\[rgba\(60,60,67,0\.6\)\]/g, replacement: 'text-apple-text-secondary' },
    // Specifically inside style={{ backgroundColor: '#F5F5F7' }} etc
    { regex: /backgroundColor:\s*'#F5F5F7'/g, replacement: 'backgroundColor: "var(--color-apple-bg)"' },
    { regex: /backgroundColor:\s*'#FFFFFF'/g, replacement: 'backgroundColor: "var(--color-apple-card)"' },
    { regex: /color:\s*'#1D1D1F'/g, replacement: 'color: "var(--color-apple-text)"' },
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            callback(path.join(dir, f));
        }
    });
}

let modifiedCount = 0;

walkDir(directoryPath, function (filePath) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;

    replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
    }
});

console.log('Modified ' + modifiedCount + ' files.');
