const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Appointments.tsx'
];

const replacements = [
  // Backgrounds
  { regex: /(?<!dark:)bg-white/g, replacement: 'bg-white dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-slate-50/g, replacement: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /(?<!dark:)bg-slate-100/g, replacement: 'bg-slate-100 dark:bg-slate-700/50' },
  { regex: /(?<!dark:)bg-slate-50\/50/g, replacement: 'bg-slate-50/50 dark:bg-slate-800/30' },
  { regex: /(?<!dark:)bg-slate-200/g, replacement: 'bg-slate-200 dark:bg-slate-700' },
  
  // Texts
  { regex: /(?<!dark:)text-slate-800/g, replacement: 'text-slate-800 dark:text-white' },
  { regex: /(?<!dark:)text-slate-700/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { regex: /(?<!dark:)text-slate-600/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /(?<!dark:)text-slate-500/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /(?<!dark:)text-slate-400/g, replacement: 'text-slate-400 dark:text-slate-500' },
  
  // Borders
  { regex: /(?<!dark:)border-slate-100/g, replacement: 'border-slate-100 dark:border-slate-700/50' },
  { regex: /(?<!dark:)border-slate-200/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /(?<!dark:)border-slate-300/g, replacement: 'border-slate-300 dark:border-slate-600' }
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});
