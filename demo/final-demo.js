console.log('=== DOM Manipulation Libraries Demo ===\n');
console.log('This demo shows how jsdom and morphdom work with HTML documents.');
console.log('Note: diff-dom requires a browser environment or specific setup.\n');

import { JSDOM } from 'jsdom';
import morphdom from 'morphdom';

// Two similar but different HTML documents
const htmlBefore = `
<div id="app">
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>`;

const htmlAfter = `
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

console.log('=== Original HTML ===');
console.log(htmlBefore);

console.log('\n=== Target HTML ===');
console.log(htmlAfter);

// 1. JSDOM Demo
console.log('\n\n=== 1. JSDOM Demo ===');
console.log('Purpose: Parse and manipulate DOM in Node.js\n');

const dom = new JSDOM(htmlBefore);
const { document } = dom.window;

// Query the DOM
const h1 = document.querySelector('h1');
const p = document.querySelector('p');
const items = document.querySelectorAll('li');

console.log('Querying original DOM:');
console.log(`- H1 text: "${h1.textContent}"`);
console.log(`- P classes: "${p.className}"`);
console.log(`- Number of items: ${items.length}`);

// Modify the DOM
console.log('\nModifying DOM with jsdom:');
h1.textContent = 'Hello from jsdom!';
h1.style.color = 'green';
p.classList.add('modified');

const newItem = document.createElement('li');
newItem.textContent = 'Item 3 (added by jsdom)';
document.querySelector('ul').appendChild(newItem);

console.log(`- Changed H1: ${h1.outerHTML}`);
console.log(`- Updated P classes: "${p.className}"`);
console.log(`- Added new item, total items: ${document.querySelectorAll('li').length}`);

// 2. Morphdom Demo
console.log('\n\n=== 2. Morphdom Demo ===');
console.log('Purpose: Efficiently morph one DOM tree into another\n');

// Setup for morphdom
const morphDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = morphDom.window;
global.document = morphDom.window.document;
global.HTMLElement = morphDom.window.HTMLElement;

// Create elements
const container = morphDom.window.document.createElement('div');
container.innerHTML = htmlBefore;
const fromElement = container.firstElementChild;

const targetContainer = morphDom.window.document.createElement('div');
targetContainer.innerHTML = htmlAfter;
const toElement = targetContainer.firstElementChild;

// Track changes
const changes = {
  added: [],
  removed: [],
  updated: []
};

console.log('Before morphing:');
console.log(`- H1: "${fromElement.querySelector('h1').textContent}"`);
console.log(`- P classes: "${fromElement.querySelector('p').className}"`);
console.log(`- Items: ${fromElement.querySelectorAll('li').length}`);
console.log(`- Has button: ${!!fromElement.querySelector('button')}`);

// Perform morphing
morphdom(fromElement, toElement, {
  onBeforeElUpdated: function(fromEl, toEl) {
    if (fromEl.nodeName === toEl.nodeName) {
      changes.updated.push(`${fromEl.nodeName}${fromEl.id ? '#' + fromEl.id : ''}`);
    }
    return true;
  },
  onNodeAdded: function(node) {
    if (node.nodeType === 1) { // Element node
      changes.added.push(node.nodeName);
    }
  },
  onNodeRemoved: function(node) {
    if (node.nodeType === 1) {
      changes.removed.push(node.nodeName);
    }
  }
});

console.log('\nAfter morphing:');
console.log(`- H1: "${fromElement.querySelector('h1').textContent}"`);
console.log(`- P classes: "${fromElement.querySelector('p').className}"`);
console.log(`- Items: ${fromElement.querySelectorAll('li').length}`);
console.log(`- Has button: ${!!fromElement.querySelector('button')}`);

console.log('\nChanges tracked:');
console.log(`- Elements added: [${changes.added.join(', ')}]`);
console.log(`- Elements removed: [${changes.removed.join(', ')}]`);
console.log(`- Elements updated: [${changes.updated.join(', ')}]`);

// 3. Comparison Summary
console.log('\n\n=== Summary: When to use each library ===\n');

console.log('1. JSDOM:');
console.log('   - Testing JavaScript that manipulates DOM');
console.log('   - Web scraping and parsing HTML');
console.log('   - Server-side rendering');
console.log('   - Any Node.js code that needs a DOM');

console.log('\n2. Morphdom:');
console.log('   - Live reloading during development');
console.log('   - Real-time updates (chat, notifications)');
console.log('   - Server-side rendering hydration');
console.log('   - Efficient DOM updates with input preservation');

console.log('\n3. diff-dom (not demonstrated):');
console.log('   - Collaborative editing applications');
console.log('   - Undo/redo functionality');
console.log('   - Change tracking and auditing');
console.log('   - When you need serializable diffs');

console.log('\n=== Key Differences ===');
console.log('- jsdom: Creates/manipulates DOM, no diffing');
console.log('- morphdom: Direct morphing, no intermediate diff');
console.log('- diff-dom: Creates diff objects, can apply/undo');

// Demo input preservation with morphdom
console.log('\n\n=== Bonus: Morphdom Input Preservation ===');

const inputHtml1 = '<form><input type="text" value="default"><button>Submit</button></form>';
const inputHtml2 = '<form><input type="text" value="new default"><button>Send</button></form>';

const form1 = morphDom.window.document.createElement('div');
form1.innerHTML = inputHtml1;
const formEl = form1.firstElementChild;

// Simulate user input
const input = formEl.querySelector('input');
input.value = 'User typed this!';

console.log('Before morph - input value:', input.value);

const form2 = morphDom.window.document.createElement('div');
form2.innerHTML = inputHtml2;

morphdom(formEl, form2.firstElementChild, {
  onBeforeElUpdated: function(fromEl, toEl) {
    // Preserve input values
    if (fromEl.tagName === 'INPUT' && fromEl.type === 'text') {
      toEl.value = fromEl.value;
    }
    return true;
  }
});

console.log('After morph - input value:', formEl.querySelector('input').value);
console.log('Button text changed:', formEl.querySelector('button').textContent);