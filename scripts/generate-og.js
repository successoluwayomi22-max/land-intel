const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const previewHtml = path.join(__dirname, '../public/og-preview.html');
const svgPath = path.join(__dirname, '../public/og-image.svg');
const outPng = path.join(__dirname, '../public/og-image.png');

const svgContent = fs.readFileSync(svgPath, 'utf8');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; background: #070D18; }
  svg { width: 1200px; height: 630px; display: block; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

fs.writeFileSync(previewHtml, html, 'utf8');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targetUrl = 'file:///' + previewHtml.replace(/\\/g, '/');

console.log('Rendering OG image with Headless Edge...');
try {
  execSync(`"${edgePath}" --headless --disable-gpu --hide-scrollbars --window-size=1200,630 "--screenshot=${outPng}" "${targetUrl}"`, { stdio: 'inherit' });
  if (fs.existsSync(outPng)) {
    const stats = fs.statSync(outPng);
    console.log(`Success! PNG generated at ${outPng} (${stats.size} bytes)`);
  } else {
    console.error('Error: PNG was not generated');
  }
} catch (e) {
  console.error('Edge execution error:', e);
} finally {
  if (fs.existsSync(previewHtml)) {
    fs.unlinkSync(previewHtml);
  }
}
