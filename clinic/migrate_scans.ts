
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Using Service Role Key to bypass RLS
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase credentials missing.');
    process.exit(1);
}

// Create client with Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const SOURCE_FOLDER = '1766070590632ztiea';
const DEST_FOLDER = '1706070824184v3p8s';
const BUCKET = 'scans';

async function migrate() {
    console.log(`Starting migration from ${SOURCE_FOLDER} to ${DEST_FOLDER}...`);

    // 1. List files in source
    const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(SOURCE_FOLDER);

    if (listError) {
        console.error('Error listing source files:', listError);
        return;
    }

    if (!files || files.length === 0) {
        console.log('No files found in source folder.');
        return;
    }

    console.log(`Found ${files.length} files. Moving...`);

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') {
            continue;
        }

        // Storage paths are relative to the bucket. 
        // If list(FOLDER) returns 'file.ply', the full path is 'FOLDER/file.ply'
        const sourcePath = `${SOURCE_FOLDER}/${file.name}`;
        const destPath = `${DEST_FOLDER}/${file.name}`;

        console.log(`Moving '${sourcePath}' -> '${destPath}'...`);

        // Try Copy first to debug (Move can be finicky if permissions vary)
        const { error: copyError } = await supabase.storage.from(BUCKET).copy(sourcePath, destPath);

        if (copyError) {
            console.error(`Failed to copy ${file.name}:`, copyError);
        } else {
            console.log(`Successfully copied ${file.name}. Deleting original...`);
            // Delete original after successful copy
            const { error: delError } = await supabase.storage.from(BUCKET).remove([sourcePath]);
            if (delError) {
                console.error(`Failed to delete source ${file.name}:`, delError);
            }
        }
    }

    console.log('Migration complete.');
}

migrate();
