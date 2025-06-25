import { JSDOM } from 'jsdom';
import { DiffDOM } from 'diff-dom';
import morphdom from 'morphdom';

console.log('=== Performance & Feature Comparison ===\n');

const createLargeHTML = (items) => `
<div id="app">
  <h1>Performance Test</h1>
  <ul>
    ${Array.from({ length: items }, (_, i) => `<li data-id="${i}">Item ${i}</li>`).join('\n    ')}
  </ul>
</div>`;

const html1 = createLargeHTML(100);
const html2 = createLargeHTML(100)
  .replace('Item 50', 'Modified Item 50')
  .replace('Item 75', 'Modified Item 75')
  .replace('</ul>', '<li data-id="100">Item 100</li>\n  </ul>');

console.log('Test setup: 100 items, 2 modifications, 1 addition\n');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document } = dom.window;

// morphdom needs global window/document/HTMLElement
global.window = dom.window;
global.document = document;
global.HTMLElement = dom.window.HTMLElement;

console.log('1. diff-dom approach:');
const ddContainer = document.createElement('div');
ddContainer.innerHTML = html1;
const ddEl1 = ddContainer.firstElementChild;
ddContainer.innerHTML = html2;
const ddEl2 = ddContainer.firstElementChild;

const dd = new DiffDOM();
const startDD = Date.now();
const diff = dd.diff(ddEl1, ddEl2);
dd.apply(ddEl1, diff);
const endDD = Date.now();
console.log(`   Time: ${endDD - startDD}ms`);
console.log(`   Diff operations: ${diff.length}`);

console.log('\n2. morphdom approach:');
const mdContainer = document.createElement('div');
mdContainer.innerHTML = html1;
const mdEl = mdContainer.firstElementChild;
mdContainer.innerHTML = html2;
const mdEl2 = mdContainer.firstElementChild;

let morphOps = 0;
const startMD = Date.now();
morphdom(mdEl, mdEl2, {
  onNodeAdded: () => morphOps++,
  onElUpdated: () => morphOps++,
  onNodeRemoved: () => morphOps++
});
const endMD = Date.now();
console.log(`   Time: ${endMD - startMD}ms`);
console.log(`   Operations: ${morphOps}`);

console.log('\n3. Feature differences:');
console.log('   diff-dom:');
console.log('   - Generates a diff that can be serialized');
console.log('   - Supports undo/redo operations');
console.log('   - More granular change tracking');
console.log('   - Heavier weight, more features');

console.log('\n   morphdom:');
console.log('   - Direct DOM morphing, no intermediate diff');
console.log('   - Smaller library size');
console.log('   - Better for real-time updates');
console.log('   - Built-in input preservation');

console.log('\n4. Use case examples:');
console.log('   diff-dom: Collaborative editing, version control, undo/redo');
console.log('   morphdom: Live reloading, server-side rendering hydration');
console.log('   jsdom: Testing, server-side DOM manipulation, web scraping');