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

console.log('All icons generated successfully!');
