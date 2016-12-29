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

//app.use(morgan('combined'));

app.get('/tiles/:x/:y', (req, res) => {

  const x = +req.params.x;
  const y = +req.params.y;

  const file = `${__dirname}/tiles/${x}/${y}.png`;
  fs.exists(file, exists => {

    if(exists) return res.sendFile(file);

    const tileSize = 16;
    const h = fractalBrownianMotion(8, x*0.0005, y*0.0005)*100;

    let bgColor;
    if(h <= 50) bgColor = {red: 0, green: 0, blue: 255};
    if(h > 50) bgColor = {red: 0, green: 255, blue: 0};
    if(h > 90) bgColor = {red: 255, green: 255, blue: 255};

    const png = new PNG({
      width: tileSize,
      height: tileSize,
      bgColor: bgColor,
      colorType: 2
    });

    fill(png, bgColor);

    mkdirp(`${__dirname}/tiles/${x}`, err => {
      if(err) return res.status(500).end(err);
      const stream = fs.createWriteStream(file);
      stream.once('close', () => res.sendFile(file));
      png.pack().pipe(stream);
    });

  });


});

app.use('/vendor', express.static(__dirname+'/node_modules'));
app.use(express.static(__dirname+'/public'));

app.listen(3000);

function fill(png, color) {
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      let idx = (png.width * y + x) << 2;
      // invert color
      png.data[idx] = color.red;
      png.data[idx+1] = color.green;
      png.data[idx+2] = color.blue;
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
