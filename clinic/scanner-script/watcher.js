const chokidar = require('chokidar');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Fuse = require('fuse.js');
const { transliterate } = require('transliteration');
require('dotenv').config();

// --- CONFIGURATION ---
const WATCH_DIR = process.env.WATCH_DIR || 'C:/Scans';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'scans';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase Credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`👀 Watching for new scans in: ${WATCH_DIR}`);

// Global state
let patientCache = [];
let fuse = null;

// --- INITIALIZATION ---
async function loadPatients() {
  console.log('🔄 Loading patient database...');
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name');

    if (error) throw error;

    // Pre-process patients for search
    patientCache = patients.map(p => {
      let t = transliterate(p.name);
      const c = normalizeString(p.name);

      // Manual variations for tricky names
      if (p.name.includes('اسراء')) t += ' asraa esraa isra';
      if (p.name.includes('علي')) t += ' ali aly';
      if (p.name.includes('محمد')) t += ' mohamed mohammed muhammed mhamad';
      if (p.name.includes('حسين')) t += ' hussein hussain';
      if (p.name.includes('زهراء')) t += ' zahraa zahra';
      if (p.name.includes('فاطمة')) t += ' fatima fatema';
      if (p.name.includes('مريم')) t += ' mariam maryam';

      return {
        ...p,
        name_transliterated: t,
        name_clean: c
      };
    });

    // Initialize Fuzzy Search with VERY relaxed threshold
    fuse = new Fuse(patientCache, {
      keys: [
        { name: 'name', weight: 1.0 },
        { name: 'name_transliterated', weight: 1.0 }, // Equal weight
        { name: 'name_clean', weight: 0.8 }
      ],
      threshold: 0.75, // Much more relaxed
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 3
    });

    console.log(`✅ Loaded ${patients.length} patients.`);
  } catch (err) {
    console.error('❌ Failed to load patients:', err.message);
  }
}

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sanitize filename for Supabase storage (remove Arabic chars)
function sanitizeFilename(filename) {
  // Replace Arabic characters with transliteration
  return transliterate(filename)
    .replace(/[^\w\s\-\.]/g, '_') // Replace special chars with underscore
    .replace(/\s+/g, '_'); // Replace spaces with underscore
}

async function startApp() {
  await loadPatients();

  if (patientCache.length === 0) {
    console.warn("⚠️ Patient cache is empty. Scans may not match until database is reachable.");
  }

  // --- WATCHER ---
  const watcher = chokidar.watch(WATCH_DIR, {
    persistent: true,
    ignoreInitial: false,
    depth: Infinity, // Scan subfolders recursively
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      await processFile(filePath);
    })
    .on('error', error => console.error(`❌ Watcher error: ${error}`));
}


// --- PROCESSOR ---
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  // Basic filter
  if (!['.stl', '.obj', '.ply', '.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.dcm'].includes(ext)) {
    return;
  }

  // Ensure DB is loaded if it failed initially
  if (patientCache.length === 0 && fuse === null) {
    await loadPatients();
    if (patientCache.length === 0) return; // Still failed
  }

  try {
    // 1. Clean up file name to extract potential patient name
    const baseName = path.parse(fileName).name;

    // Replace separators with spaces
    let cleanName = baseName.replace(/[_\-]/g, ' ');
    // Split camelCase/PascalCase
    cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Remove common dental keywords (case insensitive)
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

    // Remove long digit sequences (dates, IDs) 
    cleanName = cleanName.replace(/\d+/g, '');

    // Cleanup whitespace
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    if (cleanName.length < 3) {
      return;
    }

    // 2. Perform Fuzzy Search
    const results = fuse.search(cleanName);

    if (results.length === 0) {
      console.warn(`⚠️ No match for: "${cleanName}" (${fileName})`);
      return;
    }

    // Top match
    const bestMatch = results[0];
    const patient = bestMatch.item;
    const score = bestMatch.score;

    if (score > 0.75) {
      console.warn(`⚠️ Match too weak (${score.toFixed(2)}): "${cleanName}" -> ${patient.name}`);
      return;
    }

    console.log(`✅ MATCH: "${cleanName}" -> ${patient.name} (ID: ${patient.id}) (${score.toFixed(2)})`);

    // 3. Upload Logic with standardized naming (Timestamp_SanitizedName)
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Sanitize the filename exactly like db.ts
    const sanitizedFileName = sanitizeFilename(fileName); // Uses simplified regex
    // Format: patientId/TIMESTAMP_SanitizedName
    const storagePath = `${patient.id}/${Date.now()}_${sanitizedFileName}`;

    console.log(`🚀 Uploading to: ${storagePath} ...`);

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, { contentType, upsert: false });

    if (uploadError) {
      if (uploadError.message.includes('Duplicate')) {
        console.log('   (File already exists on storage, skipping upload)');
        // return; // Don't return, proceed to check/insert DB record because path might be different but content same? 
        // actually with timestamp this is rare.
      } else {
        throw uploadError;
      }
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    // Check if scan already exists in DB to prevent duplicates
    const { data: existingScan } = await supabase
      .from('patient_scans')
      .select('id')
      .eq('file_name', fileName) // Keep original filename in DB
      .eq('patient_id', patient.id)
      .limit(1);

    if (existingScan && existingScan.length > 0) {
      console.log('   (DB record already exists, skipping insert)');
      return;
    }

    const { error: dbError } = await supabase
      .from('patient_scans')
      .insert({
        patient_id: patient.id,
        file_name: fileName, // Original filename
        file_url: urlData.publicUrl,
        file_path: storagePath // Sanitized path
      });

    if (dbError) throw dbError;

    console.log(`🎉 Processed: ${fileName}`);

  } catch (err) {
    console.error(`❌ Error processing ${fileName}:`, err.message);
  }
}

// Start the application
startApp();
