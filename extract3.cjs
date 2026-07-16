const fs = require('fs');
const bundle = fs.readFileSync('live_bundle2.js', 'utf8');

const regex = /activeView:a,setActiveView:o([\s\S]*?)_setShiftRequests:C/g;
const match = bundle.match(regex);
if (match) {
  console.log(match[0]);
} else {
  console.log("Not found");
}
