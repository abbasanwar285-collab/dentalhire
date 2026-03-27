const Fuse = require('fuse.js');
const { transliterate } = require('transliteration');

// --- MOCK DATA ---
const patients = [
    { id: 'p1', name: 'أحمد علي' },
    { id: 'p2', name: 'زينب فيصل متعب' },
    { id: 'p3', name: 'إسراء محمد' },
    { id: 'p4', name: 'اسراء محمد' }, // Variation without hamza
    { id: 'p5', name: 'اسراء محمد علي' } // From screenshot
];

// --- LOGIC FROM WATCHER.JS ---

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[_\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Pre-process patients
const patientCache = patients.map(p => {
    let t = transliterate(p.name);
    const c = normalizeString(p.name);

    if (p.name.includes('اسراء') || p.name.includes('إسراء')) t += ' asraa esraa isra';
    if (p.name.includes('علي')) t += ' ali aly';
    if (p.name.includes('محمد')) t += ' mohamed mohammed muhammed';

    return {
        ...p,
        name_transliterated: t,
        name_clean: c
    };
});

// Initialize Fuse
const fuse = new Fuse(patientCache, {
    keys: [
        { name: 'name', weight: 1.0 },
        { name: 'name_transliterated', weight: 1.0 },
        { name: 'name_clean', weight: 0.8 }
    ],
    threshold: 0.6,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 3
});

// Test Cases
const filenames = [
    "Esraa Mohamed.stl",
    "Esraa_Mohamed.stl",
    "EsraaMohamed.stl",
    "Esraa.stl",
    "Israa Mohamed.stl",
    "Isra Mohamed.stl",
    "Asraa Mohamed.stl",
    "Zainab Faisal.stl",
    "Esra Mohamed.stl",
    "Esraa_Mohamed_upper.stl",
    "Esraa_Mohamed_lower.stl",
    "Mhamad Esraa.stl", // Reverse order
    "EsraaMohamed_UpperJaw.stl"
];

console.log("--- TESTING MATCHING LOGIC ---");

filenames.forEach(fileName => {
    // 1. Clean up
    let cleanName = fileName.split('.').slice(0, -1).join('.');
    // Replace separators with spaces
    cleanName = cleanName.replace(/[_\-]/g, ' ');
    // Split camelCase/PascalCase
    cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2');

    const keywords = [
        'maxillary', 'mandibular', 'occlusion', 'first', 'scanbody',
        'upper', 'lower', 'splint', 'occlusionfirst', 'scan', 'copy', 'final', 'rescan',
        'date', 'time',
        'jaw', 'arch', 'teeth', 'tooth', 'model', 'study', 'situation'
    ];

    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        cleanName = cleanName.replace(regex, '');
    });

    cleanName = cleanName.replace(/\d+/g, '');
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    console.log(`\nFile: "${fileName}" -> Clean: "${cleanName}"`);

    if (cleanName.length < 3) {
        console.log("   ❌ Valid text too short");
        return;
    }

    // 2. Search
    const results = fuse.search(cleanName);

    if (results.length === 0) {
        console.log("   ❌ No match found");
        return;
    }

    const bestMatch = results[0];
    const score = bestMatch.score;

    if (score > 0.6) {
        console.log(`   ⚠️ Match too weak (${score.toFixed(3)} > 0.6): -> ${bestMatch.item.name}`);
    } else {
        console.log(`   ✅ MATCH: -> ${bestMatch.item.name} (Score: ${score.toFixed(3)})`);
    }
});
