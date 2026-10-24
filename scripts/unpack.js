const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Кассовый прогноз v2 (offline).html');
const html = fs.readFileSync(filePath, 'utf8');

const manifestMatch = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
const templateMatch = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);

const outDir = path.join(__dirname, '..', 'unpacked');
fs.mkdirSync(outDir, { recursive: true });

if (manifestMatch) {
  const manifest = JSON.parse(manifestMatch[1]);
  for (const [uuid, entry] of Object.entries(manifest)) {
    let buf = Buffer.from(entry.data, 'base64');
    if (entry.compressed) {
      try { buf = zlib.gunzipSync(buf); } catch (e) { console.error('gunzip error', uuid, e); }
    }
    const ext = entry.mime.includes('javascript') ? '.js' : entry.mime.includes('html') ? '.html' : entry.mime.includes('css') ? '.css' : '.bin';
    fs.writeFileSync(path.join(outDir, uuid + ext), buf);
    console.log('Unpacked', uuid, entry.mime, buf.length);
  }
}

if (templateMatch) {
  const template = JSON.parse(templateMatch[1]);
  fs.writeFileSync(path.join(outDir, 'template.html'), template);
  console.log('Saved template.html', template.length);
}
