import { JSDOM } from 'jsdom';
import morphdom from 'morphdom';

console.log('=== Simple Demo: Comparing DOM Manipulation Libraries ===\n');

// Create two similar but different HTML documents
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

console.log('HTML Document 1:');
console.log(html1);
console.log('\nHTML Document 2:');
console.log(html2);

// 1. jsdom - Parse and manipulate DOM in Node.js
console.log('\n=== 1. jsdom ===');
console.log('Purpose: Create and manipulate DOM in Node.js (no browser needed)');

const dom1 = new JSDOM(html1);
const doc1 = dom1.window.document;

console.log('\nQuerying DOM:');
console.log('- Title from h1:', doc1.querySelector('h1').textContent);
console.log('- Message classes:', doc1.querySelector('.message').className);
console.log('- Number of list items:', doc1.querySelectorAll('li').length);

console.log('\nManipulating DOM:');
const h1 = doc1.querySelector('h1');
h1.textContent = 'Modified by jsdom!';
h1.style.color = 'blue';
console.log('Modified h1:', h1.outerHTML);

// 2. morphdom - Efficiently morph one DOM tree into another
console.log('\n\n=== 2. morphdom ===');
console.log('Purpose: Efficiently update DOM by morphing one tree into another');

const morphDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = morphDom.window;
global.document = morphDom.window.document;
global.HTMLElement = morphDom.window.HTMLElement;

const morphContainer = morphDom.window.document.createElement('div');
morphContainer.innerHTML = html1;
const fromEl = morphContainer.firstElementChild;

morphContainer.innerHTML = html2;
const toEl = morphContainer.firstElementChild;

console.log('\nBefore morphing:');
console.log('- h1 text:', fromEl.querySelector('h1').textContent);
console.log('- p classes:', fromEl.querySelector('p').className);
console.log('- li count:', fromEl.querySelectorAll('li').length);
console.log('- has button:', !!fromEl.querySelector('button'));

const stats = {
  nodeAdded: 0,
  nodeRemoved: 0,
  nodeUpdated: 0
};

morphdom(fromEl, toEl, {
  onNodeAdded: () => stats.nodeAdded++,
  onNodeRemoved: () => stats.nodeRemoved++,
  onElUpdated: () => stats.nodeUpdated++
});

console.log('\nAfter morphing:');
console.log('- h1 text:', fromEl.querySelector('h1').textContent);
console.log('- p classes:', fromEl.querySelector('p').className);
console.log('- li count:', fromEl.querySelectorAll('li').length);
console.log('- has button:', !!fromEl.querySelector('button'));

console.log('\nMorphing statistics:');
console.log('- Nodes added:', stats.nodeAdded);
console.log('- Nodes removed:', stats.nodeRemoved);
console.log('- Nodes updated:', stats.nodeUpdated);

// 3. Manual DOM diffing example
console.log('\n\n=== 3. Manual DOM Diffing (for comparison) ===');
console.log('Purpose: Show what a DOM diff might look like');

const manualDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const manualDoc = manualDom.window.document;

const container1 = manualDoc.createElement('div');
container1.innerHTML = html1;
const manual1 = container1.firstElementChild;

const container2 = manualDoc.createElement('div');
container2.innerHTML = html2;
const manual2 = container2.firstElementChild;

console.log('\nManual comparison:');
console.log('- h1 text changed:', manual1.querySelector('h1').textContent, '→', manual2.querySelector('h1').textContent);
console.log('- p class changed:', manual1.querySelector('p').className, '→', manual2.querySelector('p').className);
console.log('- li added:', manual1.querySelectorAll('li').length, '→', manual2.querySelectorAll('li').length);
console.log('- button added:', !!manual1.querySelector('button'), '→', !!manual2.querySelector('button'));

console.log('\n=== Summary ===');
console.log('\n1. jsdom:');
console.log('   - Full DOM implementation in Node.js');
console.log('   - Use for: Testing, scraping, server-side rendering');
console.log('   - Not for: DOM diffing or efficient updates');

console.log('\n2. morphdom:');
console.log('   - Efficient DOM morphing with minimal changes');
console.log('   - Use for: Live updates, hot reloading, real-time apps');
console.log('   - Features: Input preservation, minimal DOM mutations');

console.log('\n3. diff-dom (not shown in detail):');
console.log('   - Creates serializable diffs between DOM trees');
console.log('   - Use for: Undo/redo, collaborative editing, change tracking');
console.log('   - Features: Reversible patches, diff serialization');