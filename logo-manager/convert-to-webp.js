#!/usr/bin/env node
/**
 * convert-to-webp.js
 * 
 * Converts all downloaded logos to WebP format for better performance.
 * Processes PNG, JPG, JPEG, GIF files in the logos/ directory.
 * 
 * Usage:
 *   npm install sharp
 *   node convert-to-webp.js
 * 
 * Options:
 *   --quality=80     Set WebP quality (1-100, default: 80)
 *   --resize=800     Resize max width (optional)
 *   --force          Overwrite existing WebP files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_DIR = './logos';
const OUTPUT_DIR = './logos-webp';
const DEFAULT_QUALITY = 80;
const SUPPORTED_FORMATS = /\.(png|jpe?g|gif)$/i;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quality: DEFAULT_QUALITY,
  resize: null,
  force: false
};

args.forEach(arg => {
  if (arg.startsWith('--quality=')) {
    options.quality = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--resize=')) {
    options.resize = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--force') {
    options.force = true;
  }
});

console.log('🎨 Logo to WebP Converter');
console.log('========================\n');
console.log(`Input:   ${path.resolve(INPUT_DIR)}`);
console.log(`Output:  ${path.resolve(OUTPUT_DIR)}`);
console.log(`Quality: ${options.quality}`);
if (options.resize) {
  console.log(`Resize:  max width ${options.resize}px`);
}
console.log(`Force:   ${options.force}\n`);

// Check if input directory exists
if (!fs.existsSync(INPUT_DIR)) {
  console.error(`❌ Error: Input directory not found: ${INPUT_DIR}`);
  console.error('Please run download_logos.py first to download logos.');
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
}

// Get all image files
const files = fs.readdirSync(INPUT_DIR)
  .filter(f => SUPPORTED_FORMATS.test(f))
  .sort();

if (files.length === 0) {
  console.error('❌ No image files found in logos/ directory');
  console.error('Supported formats: PNG, JPG, JPEG, GIF');
  process.exit(1);
}

console.log(`Found ${files.length} images to convert\n`);

// Statistics
let converted = 0;
let skipped = 0;
let failed = 0;
let totalSizeBefore = 0;
let totalSizeAfter = 0;

// Process each file
const promises = files.map(async (file) => {
  const inputPath = path.join(INPUT_DIR, file);
  const outputFile = file.replace(SUPPORTED_FORMATS, '.webp');
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  // Skip if output already exists (unless --force)
  if (fs.existsSync(outputPath) && !options.force) {
    console.log(`⏭️  ${file} → ${outputFile} (already exists)`);
    skipped++;
    return;
  }

  try {
    // Get input file size
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    totalSizeBefore += inputSize;

    // Convert to WebP
    let pipeline = sharp(inputPath);

    // Optional resize
    if (options.resize) {
      pipeline = pipeline.resize({
        width: options.resize,
        withoutEnlargement: true, // Don't upscale smaller images
        fit: 'inside'
      });
    }

    // Convert to WebP
    await pipeline
      .webp({ quality: options.quality })
      .toFile(outputPath);

    // Get output file size
    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    totalSizeAfter += outputSize;

    // Calculate savings
    const saved = inputSize - outputSize;
    const percent = ((saved / inputSize) * 100).toFixed(1);
    const savedKB = (saved / 1024).toFixed(1);

    console.log(`✅ ${file} → ${outputFile} (saved ${savedKB} KB, ${percent}%)`);
    converted++;
  } catch (err) {
    console.error(`❌ ${file} → Error: ${err.message}`);
    failed++;
  }
});

// Wait for all conversions to complete
Promise.all(promises).then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('Conversion Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Converted: ${converted}`);
  console.log(`⏭️  Skipped:   ${skipped}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log(`📁 Total:     ${files.length}`);
  
  if (converted > 0) {
    const savedTotal = totalSizeBefore - totalSizeAfter;
    const percentTotal = ((savedTotal / totalSizeBefore) * 100).toFixed(1);
    const savedMB = (savedTotal / 1024 / 1024).toFixed(2);
    
    console.log('\n📊 Size Reduction:');
    console.log(`Before: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
    console.log(`After:  ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Saved:  ${savedMB} MB (${percentTotal}%)`);
  }
  
  console.log(`\n📂 WebP files saved to: ${path.resolve(OUTPUT_DIR)}`);
});

