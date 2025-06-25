import { JSDOM } from 'jsdom';
import { DiffDOM } from 'diff-dom';

console.log('=== diff-dom Demo ===\n');

const html1 = `
<div id="app">
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>`;

const html2 = `
<div id="app">
  <h1>Hello Universe</h1>
  <p class="message warning">This is the updated message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <button>Click me</button>
</div>`;

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document, window } = dom.window;

// diff-dom needs global window/document
global.window = window;
global.document = document;

const container = document.createElement('div');
container.innerHTML = html1;
const el1 = container.firstElementChild;

const container2 = document.createElement('div');
container2.innerHTML = html2;
const el2 = container2.firstElementChild;

document.body.appendChild(el1.cloneNode(true));

const dd = new DiffDOM({ window: dom.window });

const diff = dd.diff(el1, el2);

console.log('Differences found:', diff.length);
console.log('\nDetailed differences:');
diff.forEach((change, index) => {
  console.log(`\n${index + 1}. Action: ${change.action}`);
  if (change.name) console.log('   Name:', change.name);
  if (change.value) console.log('   Value:', change.value);
  if (change.oldValue) console.log('   Old Value:', change.oldValue);
  if (change.newValue) console.log('   New Value:', change.newValue);
  if (change.route) console.log('   Route:', change.route);
});

console.log('\nBefore applying diff:');
console.log(el1.outerHTML);

dd.apply(el1, diff);

console.log('\nAfter applying diff:');
console.log(el1.outerHTML);

console.log('\nReverting changes...');
const undoDiff = dd.undo(el1, diff);
console.log('Reverted:', undoDiff);
console.log(el1.outerHTML);