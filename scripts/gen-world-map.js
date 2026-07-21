/* Regenerates the WORLD_DOTS string used by the landing-page creator mesh
   (public/index.html, renderHome). Run once if you ever want to change the dot
   spacing/density or the coordinate space — not part of the build, not shipped.

   Usage:
     curl -sL -o land-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json
     node scripts/gen-world-map.js
     # prints per-node land-check diagnostics to stderr,
     # writes world_dots.json + world_dots_compact.txt next to this script
   Then paste world_dots_compact.txt's contents into WORLD_DOTS in index.html. */
const fs = require('fs');
const topo = JSON.parse(fs.readFileSync(__dirname + '/land-110m.json', 'utf8'));

const { transform, arcs: rawArcs } = topo;
const { scale, translate } = transform;

// decode each arc (delta-encoded, quantized) into absolute [lon,lat] pairs
const arcs = rawArcs.map(arc => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

function getArc(i) {
  if (i >= 0) return arcs[i];
  // negative index = reversed arc, topojson encodes as ~i
  const a = arcs[~i].slice().reverse();
  return a;
}

function ringFromArcs(arcIdxs) {
  let ring = [];
  arcIdxs.forEach((idx, k) => {
    const seg = getArc(idx);
    ring = ring.concat(k === 0 ? seg : seg.slice(1));
  });
  return ring;
}

const land = topo.objects.land;
const polygons = []; // each polygon = array of rings; ring0 = outer
land.geometries.forEach(geom => {
  if (geom.type === 'Polygon') {
    polygons.push(geom.arcs.map(ringFromArcs));
  } else if (geom.type === 'MultiPolygon') {
    geom.arcs.forEach(poly => polygons.push(poly.map(ringFromArcs)));
  }
});

function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointOnLand(lon, lat) {
  for (const poly of polygons) {
    if (pointInRing([lon, lat], poly[0])) {
      // check holes (rare for land dataset, but be correct)
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInRing([lon, lat], poly[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

// ---- match the app's SVG coordinate space: viewBox 0 0 210 100 ----
// lon = (x/210)*360 - 180   =>   x = (lon+180)/360*210
// lat = 90 - (y/100)*180    =>   y = (90-lat)/180*100
const MW = 210, MH = 100;
function toXY(lon, lat) { return [(lon + 180) / 360 * MW, (90 - lat) / 180 * MH]; }
function toLonLat(x, y) { return [x / MW * 360 - 180, 90 - y / MH * 180]; }

const dots = [];
const STEP = 3.0;
for (let y = 4; y < 94; y += STEP) {
  const rowOffset = (Math.round(y / STEP) % 2) ? STEP / 2 : 0;
  for (let x = 2 + rowOffset; x < MW - 1; x += STEP) {
    const [lon, lat] = toLonLat(x, y);
    if (lat < -58) continue; // crop most of Antarctica like typical stylized world maps
    if (pointOnLand(lon, lat)) dots.push([+x.toFixed(1), +y.toFixed(1)]);
  }
}

console.error('dot count:', dots.length);
fs.writeFileSync(__dirname + '/world_dots.json', JSON.stringify(dots));
fs.writeFileSync(__dirname + '/world_dots_compact.txt', dots.map(([x,y])=>x+','+y).join(' '));

// quick sanity: verify the meshNodes coordinates used in index.html (percent
// space, so svg x = pct * MW/100) actually land on real land
const nodes = [
  {name:'N America', pct:22.2, y:27.8}, {name:'S America', pct:33.9, y:58.3},
  {name:'Europe', pct:53.3, y:22.2}, {name:'Africa', pct:55.6, y:48.3},
  {name:'Hub (Middle East)', pct:61.7, y:36.7}, {name:'E Asia', pct:79.4, y:31.7},
  {name:'Oceania', pct:87.5, y:63.9},
];
nodes.forEach(n => {
  const x = n.pct * MW / 100;
  const [lon, lat] = toLonLat(x, n.y);
  const near = dots.filter(([dx, dy]) => Math.hypot(dx - x, dy - n.y) < 8).length;
  console.error(n.name, 'x,y=', x.toFixed(1), n.y, 'lon,lat=', lon.toFixed(1), lat.toFixed(1), 'onLand=', pointOnLand(lon, lat), 'nearDots=', near);
});
