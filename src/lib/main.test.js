const main = require('./main');
const fs = require('fs');
const path = require('path');

test('Ensure output directory exists', () => {
  expect();
});
test('Ensure output directory exists', () => {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  expect(fs.existsSync(outputDir)).toBe(true);
});

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
  };
}
function expect() {
  throw new Error('Function not implemented.');
}
