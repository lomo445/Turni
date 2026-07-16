const fs = require('fs');
const bundle = fs.readFileSync('live_bundle.js', 'utf8');

const regex = /localStorage\.setItem\("debug_trace",d\)([\s\S]*?)catch/;
const match = bundle.match(regex);
if (match) {
  console.log(match[0]);
} else {
  console.log("Not found");
}
