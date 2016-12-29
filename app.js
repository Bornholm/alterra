const express = require('express');
const morgan = require('morgan');
const SimplexNoise = require('simplex-noise');
const PNG = require('pngjs').PNG;
const seedrandom = require('seedrandom');
const fs = require('fs');
const mkdirp = require('mkdirp');

const app = express();
const seed = 'hello world !';
const simplex = new SimplexNoise(seedrandom(seed));

// app.use(morgan('combined'));

app.get('/tiles/:x/:y', (req, res) => {
  const x = +req.params.x;
  const y = +req.params.y;
  res.set('Content-Type', 'image/png');
  return createTileStream(x, y).pack().pipe(res);
});

app.use('/vendor', express.static(__dirname+'/node_modules'));
app.use(express.static(__dirname+'/public'));

app.listen(8080);

function createTileStream(tileX, tileY) {

  const pixelSize = 1;
  const tileSize = 256;

  const png = new PNG({
    width: tileSize,
    height: tileSize,
    colorType: 6
  });

  // console.log(`Render tile ${tileX},${tileY}`);

  for(let localTileY = 0; localTileY < tileSize; localTileY += pixelSize) {
    for(let localTileX = 0; localTileX < tileSize; localTileX += pixelSize) {

      let globalX = (tileX*tileSize)+localTileX;
      let globalY = (tileY*tileSize)+localTileY;

      // console.log(`globalX: ${globalX} globalY: ${globalY}`);
      // console.log(`localX: ${localTileX} localY: ${localTileY}`);

      let h = fractalBrownianMotion(8, globalX*0.0005, globalY*0.0005)*100;

      // console.log(`Height: ${h}`);

      let bgColor;

      if(h <= 10) bgColor = {red: 8, green: 104, blue: 172};
      if(h > 10 && h <= 50) bgColor = {red: 67, green: 162, blue: 202};
      if(h > 50) bgColor = {red: 186, green: 228, blue: 188};
      if(h > 90) bgColor = {red: 240, green: 249, blue: 232};

      // console.log(`Color: ${JSON.stringify(bgColor)}`);
      let rect = {x: localTileX, y: localTileY, w: pixelSize, h: pixelSize};
      // console.log(`Pixel Rect: ${JSON.stringify(rect)}`);

      fillRect(png, bgColor, rect);

    }

  }

  return png;

}

function fillRect(png, color, rect) {
  for (let y = rect.y; y < rect.y+rect.h; y++) {
    for (let x = rect.x; x < rect.x+rect.w; x++) {
      let idx = (png.width * y + x) << 2;
      // invert color
      png.data[idx] = color.red;
      png.data[idx+1] = color.green;
      png.data[idx+2] = color.blue;
      png.data[idx+3] = 255;
    }
  }
}

function fractalBrownianMotion(octaves, x, y) {
  const lacunarity = 1.9;
  const gain = 0.65;
  let sum = 0;
  let amplitude = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * simplex.noise2D(x, y);
    amplitude *= gain;
    x *= lacunarity;
    y *= lacunarity;
  }
  return sum;
}
