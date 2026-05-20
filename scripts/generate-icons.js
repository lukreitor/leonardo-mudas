#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('\n⚠ sharp não está instalado.');
    console.error('Rode: npm install --save-dev sharp');
    console.error('Depois: node scripts/generate-icons.js\n');
    process.exit(1);
  }

  const dir = path.join(__dirname, '..', 'assets', 'images');
  const iconSvg = fs.readFileSync(path.join(dir, 'icon.svg'));
  const splashSvg = fs.readFileSync(path.join(dir, 'splash-icon.svg'));

  console.log('🎨 Gerando ícones...');

  await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(dir, 'icon.png'));
  console.log('  ✓ icon.png (1024×1024)');

  await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(dir, 'android-icon-foreground.png'));
  console.log('  ✓ android-icon-foreground.png');

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#1A3A2E"/></svg>`;
  await sharp(Buffer.from(bgSvg)).resize(1024, 1024).png().toFile(path.join(dir, 'android-icon-background.png'));
  console.log('  ✓ android-icon-background.png (solid mata)');

  await sharp(iconSvg).resize(1024, 1024).grayscale().png().toFile(path.join(dir, 'android-icon-monochrome.png'));
  console.log('  ✓ android-icon-monochrome.png (grayscale)');

  await sharp(splashSvg).resize(2048, 2048).png().toFile(path.join(dir, 'splash-icon.png'));
  console.log('  ✓ splash-icon.png (2048×2048)');

  await sharp(iconSvg).resize(48, 48).png().toFile(path.join(dir, 'favicon.png'));
  console.log('  ✓ favicon.png (48×48)');

  console.log('\n🌱 Ícones gerados em assets/images/');
}

main().catch((e) => {
  console.error('Erro:', e);
  process.exit(1);
});
