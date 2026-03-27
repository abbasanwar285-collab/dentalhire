const fs = require('fs');
const path = 'src/data/patients.json';

try {
    const data = fs.readFileSync(path, 'utf8');
    JSON.parse(data);
    console.log('JSON is Valid');
} catch (e) {
    console.log('Error:', e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const data = fs.readFileSync(path, 'utf8');

        // Handle lines/cols manually
        let line = 1;
        let col = 1;
        for (let i = 0; i < pos; i++) {
            if (data[i] === '\n') {
                line++;
                col = 1;
            } else {
                col++;
            }
        }

        console.log(`Location: Line ${line}, Column ${col}`);
        const start = Math.max(0, pos - 100);
        const end = Math.min(data.length, pos + 100);
        console.log('Context:\n' + data.substring(start, pos) + '>>>ERROR<<<' + data.substring(pos, end));
    }
}
