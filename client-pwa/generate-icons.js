#!/usr/bin/env node
// ============================================================
// AgroLingo AI — PWA Icon Generator
// Generates all required icon sizes from the SVG logo
// Usage: node generate-icons.js
// Requires: npm install sharp (run once)
// ============================================================

// First: npm install sharp --save-dev

const fs   = require('fs');
const path = require('path');

// Try to load sharp — guide user if missing
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('\n❌ sharp not installed. Run:');
  console.log('   npm install sharp --save-dev\n');
  process.exit(1);
}

// ── AgroLingo Logo SVG ────────────────────────────────────
// The A-frame with gold leaf mark on a deep green background
const LOGO_SVG = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#0E2D1A"/>
  
  <!-- Inner gradient overlay -->
  <rect width="512" height="512" rx="112" fill="url(#bg-grad)" opacity="0.6"/>
  
  <!-- Border -->
  <rect x="2" y="2" width="508" height="508" rx="110"
    fill="none" stroke="rgba(61,155,102,0.3)" stroke-width="4"/>
  
  <!-- A-frame strokes -->
  <path d="M90 420 L256 120 L422 420"
    stroke="white" stroke-width="44" stroke-linecap="round"
    stroke-linejoin="round" fill="none"/>
  
  <!-- Crossbar -->
  <path d="M160 310 L352 310"
    stroke="white" stroke-width="40" stroke-linecap="round"/>
  
  <!-- Gold leaf -->
  <path d="M256 120 C256 120 370 200 350 310
           C336 385 256 408 256 408
           C256 408 176 328 196 240
           C210 164 256 120 256 120Z"
    fill="#F5A623" opacity="0.96"/>
  
  <!-- Gold arrow up-right -->
  <path d="M340 265 L412 193" stroke="#F5A623"
    stroke-width="34" stroke-linecap="round"/>
  <path d="M380 193 L412 193 L412 225"
    stroke="#F5A623" stroke-width="34"
    stroke-linecap="round" stroke-linejoin="round"/>
  
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="512" y2="512">
      <stop offset="0%" stop-color="#1A4731"/>
      <stop offset="100%" stop-color="#060D09"/>
    </linearGradient>
  </defs>
</svg>
`;

// ── Maskable version (safe zone: inner 80%) ───────────────
const MASKABLE_SVG = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Full bleed background (no rounded corners for maskable) -->
  <rect width="512" height="512" fill="#0E2D1A"/>
  <rect width="512" height="512" fill="url(#bg-mask)" opacity="0.6"/>
  
  <!-- Scaled to 80% safe zone = 205px each side, offset 51px -->
  <g transform="translate(51, 51) scale(0.8)">
    <path d="M90 420 L256 120 L422 420"
      stroke="white" stroke-width="52" stroke-linecap="round"
      stroke-linejoin="round" fill="none"/>
    <path d="M160 310 L352 310"
      stroke="white" stroke-width="48" stroke-linecap="round"/>
    <path d="M256 120 C256 120 370 200 350 310
             C336 385 256 408 256 408
             C256 408 176 328 196 240
             C210 164 256 120 256 120Z"
      fill="#F5A623" opacity="0.96"/>
    <path d="M340 265 L412 193" stroke="#F5A623"
      stroke-width="40" stroke-linecap="round"/>
    <path d="M380 193 L412 193 L412 225"
      stroke="#F5A623" stroke-width="40"
      stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <defs>
    <linearGradient id="bg-mask" x1="0" y1="0" x2="512" y2="512">
      <stop offset="0%" stop-color="#1A4731"/>
      <stop offset="100%" stop-color="#060D09"/>
    </linearGradient>
  </defs>
</svg>
`;

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🌾 AgroLingo AI — Generating PWA Icons\n');

  for (const size of SIZES) {
    const isMaskable = size === 192 || size === 512;
    const svg = isMaskable ? MASKABLE_SVG : LOGO_SVG;

    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`  ✓ icon-${size}.png ${isMaskable ? '(maskable)' : ''}`);
  }

  // Generate favicon.ico equivalent (32px)
  await sharp(Buffer.from(LOGO_SVG))
    .resize(32, 32)
    .png()
    .toFile(path.join(OUTPUT_DIR, '..', 'favicon.png'));
  console.log('  ✓ favicon.png (32x32)');

  // Apple touch icon (180px)
  await sharp(Buffer.from(LOGO_SVG))
    .resize(180, 180)
    .png()
    .toFile(path.join(OUTPUT_DIR, '..', 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (180x180)');

  console.log('\n✅ All icons generated in public/icons/\n');
  console.log('📋 Add to index.html <head>:');
  console.log('   <link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  console.log('   <link rel="icon" type="image/png" href="/favicon.png">');
}

generate().catch(err => {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
});
