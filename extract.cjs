const fs = require('fs');
const bundle = fs.readFileSync('live_bundle.js', 'utf8');

const idx = bundle.indexOf('debug_trace');
if (idx > -1) {
  console.log(bundle.substring(Math.max(0, idx - 100), idx + 800));
} else {
  console.log("Not found");
}
