import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('./public/logo-official.svg');
const svgBuffer = fs.readFileSync(svgPath);

function renderPng(size, outputPath) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });

  const image = resvg.render();
  const pngBuffer = image.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

renderPng(512, './public/icon-512.png');
renderPng(192, './public/icon-192.png');
renderPng(512, './public/icon.png');
renderPng(512, './public/logo-official.png');

// Copy directly to src/assets/images as well for direct bundled import
fs.mkdirSync('./src/assets/images', { recursive: true });
renderPng(512, './src/assets/images/logo-official.png');
renderPng(512, './src/assets/images/msoccer_logo_1783863321533.jpg');

console.log('All icons generated successfully!');
