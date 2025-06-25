import { JSDOM } from 'jsdom';
import { DiffDOM } from 'diff-dom';


console.log('=== Working diff-dom Demo ===\n');

// Create a JSDOM instance
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document } = dom.window;

// Create the DiffDOM instance
const dd = new DiffDOM();      

// Create two DOM elements with different content
const container1 = document.createElement('div');
container1.innerHTML = `
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;

const container2 = document.createElement('div');
container2.innerHTML = `
  <h1>Hello Universe</h1>
  <p class="message warning">This is the updated message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <button>Click me</button>
`;

const html1 = `
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;
const html2 = `
  <h1>Hello Universe</h1>
  <p class="message warning">This is the updated message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <button>Click me</button>
`;

const diff1  = dd.diff(html1, html2);
console.log(diff1.length, diff1);

// Get the differences
const diff = dd.diff(container1, container2);

console.log('Number of differences found:', diff.length);
console.log('\nDetailed differences:');

diff.forEach((change, index) => {
  console.log(`\n${index + 1}. Change type: ${change.action}`);
  
  switch(change.action) {
    case 'modifyTextElement':
      console.log(`   Old text: "${change.oldValue}"`);
      console.log(`   New text: "${change.newValue}"`);
      console.log(`   Path: [${change.route.join(', ')}]`);
      break;
      
    case 'addAttribute':
      console.log(`   Attribute: ${change.name}`);
      console.log(`   Value: "${change.value}"`);
      console.log(`   Path: [${change.route.join(', ')}]`);
      break;
      
    case 'removeAttribute':
      console.log(`   Attribute: ${change.name}`);
      console.log(`   Path: [${change.route.join(', ')}]`);
      break;
      
    case 'addElement':
      console.log(`   Element: ${change.element.nodeName}`);
      if (change.element.textContent) {
        console.log(`   Content: "${change.element.textContent.trim()}"`);
      }
      console.log(`   Path: [${change.route.join(', ')}]`);
      break;
      
    case 'removeElement':
      console.log(`   Element removed`);
      console.log(`   Path: [${change.route.join(', ')}]`);
      break;
      
    default:
      console.log(`   Details:`, change);
  }
});

console.log('\n\nOriginal HTML:');
console.log(container1.innerHTML);

console.log('\nApplying diff...');
dd.apply(container1, diff);

console.log('\nHTML after applying diff:');
console.log(container1.innerHTML);

console.log('\nVerifying the result matches target:');
console.log('Matches target:', container1.innerHTML.trim() === container2.innerHTML.trim());

// Demonstrate undo capability
console.log('\n\n=== Undo Demo ===');
console.log('Undoing all changes...');
dd.undo(container1, diff);

console.log('\nHTML after undo:');
console.log(container1.innerHTML);

// Show a more complex example with attribute changes
console.log('\n\n=== Attribute Changes Demo ===');

const attrContainer1 = document.createElement('div');
attrContainer1.innerHTML = `
  <div id="test" class="old-class" data-value="123">
    <span style="color: red;">Red text</span>
    <input type="text" value="old value" />
  </div>
`;

const attrContainer2 = document.createElement('div');
attrContainer2.innerHTML = `
  <div id="test" class="new-class" data-value="456" data-extra="bonus">
    <span style="color: blue; font-weight: bold;">Blue bold text</span>
    <input type="text" value="new value" disabled />
  </div>
`;

const attrDiff = dd.diff(attrContainer1, attrContainer2);
console.log('Attribute changes found:', attrDiff.length);

attrDiff.forEach((change, index) => {
  console.log(`\n${index + 1}. ${change.action}:`);
  if (change.name) console.log(`   Attribute: ${change.name}`);
  if (change.oldValue !== undefined) console.log(`   Old value: "${change.oldValue}"`);
  if (change.newValue !== undefined) console.log(`   New value: "${change.newValue}"`);
  if (change.value !== undefined) console.log(`   Value: "${change.value}"`);
});