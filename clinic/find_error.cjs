const fs = require('fs');
const path = 'src/data/patients.json';
const data = fs.readFileSync(path, 'utf8');

const regex = /([a-zA-Z0-9_]*)mount":\s*([},])/g;
let match;
let found = false;
while ((match = regex.exec(data)) !== null) {
    found = true;
    console.log(`Found invalid pattern at index ${match.index}: "...${match[1]}mount": followed by '${match[2]}'`);

    // Calculate line number
    const before = data.substring(0, match.index);
    const line = before.split('\n').length;
    console.log(`Line: ${line}`);

    // Context
    const start = Math.max(0, match.index - 50);
    const end = Math.min(data.length, match.index + 50);
    console.log('Context: ...' + data.substring(start, end).replace(/\n/g, '\\n') + '...');
}

if (!found) {
    console.log('No "...mount": followed by } or , found.');
}
