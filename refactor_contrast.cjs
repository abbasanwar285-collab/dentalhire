const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
    // TreatmentPlanBuilder & Dashboard solid backgrounds to opacity backgrounds
    'bg-[#F4F9FF]': 'bg-[#0071E3]/[0.04] dark:bg-[#0071E3]/10',
    'bg-[#E5F1FF]': 'bg-[#0071E3]/[0.08] dark:bg-[#0071E3]/20',
    'bg-[#F5F3FF]': 'bg-[#5856D6]/[0.04] dark:bg-[#5856D6]/10',
    'bg-[#FFF8E5]': 'bg-[#FF9500]/[0.06] dark:bg-[#FF9500]/10',
    'bg-[#F0FAFA]': 'bg-[#32ADE6]/[0.06] dark:bg-[#32ADE6]/10',
    'bg-[#FFFDF0]': 'bg-[#FFCC00]/[0.06] dark:bg-[#FFCC00]/10',
    'bg-[#FFF9CC]': 'bg-[#FFCC00]/[0.1] dark:bg-[#FFCC00]/15',
    'bg-[#FEF6CC]': 'bg-[#E5CA3A]/[0.1] dark:bg-[#E5CA3A]/15',

    // Specific grey texts that need to be apple-text-secondary for dark mode adaptivity
    'text-[#8E8E93]': 'text-apple-text-secondary',
};

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            for (const [search, replace] of Object.entries(replacements)) {
                // Simple string replacement across the file
                if (content.includes(search)) {
                    content = content.split(search).join(replace);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath.replace(__dirname, '')}`);
            }
        }
    });
}

processDirectory(directoryPath);
console.log('Finished refactoring contrast colors.');
