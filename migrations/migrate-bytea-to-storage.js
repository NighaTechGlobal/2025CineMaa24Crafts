/**
 * Migration script: Convert posts.image (bytea) to posts.image_url (text)
 * 
 * This script:
 * 1. Fetches all posts with bytea image data
 * 2. Uploads each image to Supabase Storage (photos bucket)
 * 3. Updates posts.image_url with the public URL
 * 4. Logs failures to migrate-failures.csv for manual review
 * 
 * Usage:
 *   node migrations/migrate-bytea-to-storage.js
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   DATABASE_URL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const pool = new Pool({ connectionString: DATABASE_URL });

const BUCKET = 'photos';
const FAILURES_LOG = 'migrate-failures.csv';
const REPORT_FILE = 'migration-report.json';

function detectMimeType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  // Default to JPEG
  return { mime: 'image/jpeg', ext: 'jpg' };
}

async function migrate() {
  const client = await pool.connect();
  const results = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    failures: [],
  };

  try {
    console.log('🚀 Starting bytea to storage migration...\n');

    // Fetch all posts with image bytea
    const res = await client.query(`
      SELECT id, image, created_at 
      FROM posts 
      WHERE image IS NOT NULL AND (image_url IS NULL OR image_url = '')
    `);

    results.total = res.rowCount;
    console.log(`📊 Found ${results.total} posts to migrate\n`);

    if (results.total === 0) {
      console.log('✅ No posts to migrate. All done!');
      return results;
    }

    // Initialize failures log
    if (fs.existsSync(FAILURES_LOG)) {
      fs.unlinkSync(FAILURES_LOG);
    }
    fs.writeFileSync(FAILURES_LOG, 'post_id,error,timestamp\n');

    for (const row of res.rows) {
      const { id, image } = row;
      
      try {
        // Convert bytea to Buffer
        let buffer;
        if (Buffer.isBuffer(image)) {
          buffer = image;
        } else if (typeof image === 'string') {
          // Hex string (e.g., \x123abc...)
          const hexStr = image.startsWith('\\x') ? image.slice(2) : image;
          buffer = Buffer.from(hexStr, 'hex');
        } else {
          throw new Error('Unsupported image format');
        }

        if (buffer.length === 0) {
          console.log(`⚠️  Post ${id}: empty image, skipping`);
          results.skipped++;
          continue;
        }

        // Detect MIME type
        const { mime, ext } = detectMimeType(buffer);
        const fileName = `posts/${id}_${Date.now()}.${ext}`;

        console.log(`📤 Uploading post ${id} (${(buffer.length / 1024).toFixed(2)} KB, ${mime})...`);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadErr } = await supabase
          .storage
          .from(BUCKET)
          .upload(fileName, buffer, {
            contentType: mime,
            upsert: true,
          });

        if (uploadErr) {
          throw new Error(`Storage upload failed: ${uploadErr.message}`);
        }

        // Get public URL
        const { data: publicData } = supabase
          .storage
          .from(BUCKET)
          .getPublicUrl(fileName);

        const publicUrl = publicData.publicUrl;

        // Update database
        await client.query(
          `UPDATE posts SET image_url = $1 WHERE id = $2`,
          [publicUrl, id]
        );

        console.log(`✅ Post ${id} migrated -> ${publicUrl}\n`);
        results.migrated++;

      } catch (err) {
        console.error(`❌ Post ${id} failed: ${err.message}\n`);
        results.failed++;
        results.failures.push({ id, error: err.message });
        
        // Log to CSV
        const timestamp = new Date().toISOString();
        fs.appendFileSync(FAILURES_LOG, `${id},"${err.message}",${timestamp}\n`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total posts:     ${results.total}`);
    console.log(`✅ Migrated:     ${results.migrated}`);
    console.log(`⚠️  Skipped:      ${results.skipped}`);
    console.log(`❌ Failed:       ${results.failed}`);
    console.log('='.repeat(50));

    if (results.failed > 0) {
      console.log(`\n⚠️  ${results.failed} posts failed. Check ${FAILURES_LOG} for details.`);
    }

    // Write report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    console.log(`\n📝 Full report saved to ${REPORT_FILE}`);

  } finally {
    client.release();
    await pool.end();
  }

  return results;
}

// Run migration
migrate()
  .then((results) => {
    const exitCode = results.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });
