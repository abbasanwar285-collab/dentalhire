const fs = require('fs');
const path = 'src/data/patients.json';

try {
    console.log('Reading file...');
    let data = fs.readFileSync(path, 'utf8');

    // Regex to find "ortho_paid_amount": followed by optional whitespace and then a '}'
    // The previous script confirmed this specific key is the culprit.
    const regex = /"ortho_paid_amount":(\s*)\}/;

    if (regex.test(data)) {
        console.log('Found invalid pattern. Fixing...');
        // Replace with "ortho_paid_amount": 0 followed by the captured whitespace and brace
        const newData = data.replace(regex, '"ortho_paid_amount": 0$1}');

        fs.writeFileSync(path, newData, 'utf8');
        console.log('File patched successfully.');
    } else {
        console.log('Pattern not found. File might already be fixed?');
    }

} catch (e) {
    console.error('Error fixing file:', e);
}
