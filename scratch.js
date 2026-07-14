const CYCLE = ['P', 'M', 'N', 'L', 'L', 'P', 'M', 'N', 'L', 'L', 'J', 'J', 'J', 'J', 'J'];
let offset = 2; // March 1st
let d = new Date(2026, 2, 1); // March 1st

let out = "FEDELI 2026:\n";
for (let month = 2; month <= 11; month++) {
  let monthStr = "";
  let daysInMonth = new Date(2026, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    let cycleIndex = (offset + day - 1) % 15;
    monthStr += CYCLE[cycleIndex] + " ";
  }
  out += `Mese ${month+1}: ${monthStr}\n`;
  offset = (offset + daysInMonth) % 15;
}
console.log(out);
