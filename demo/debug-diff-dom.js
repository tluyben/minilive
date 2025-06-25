import { JSDOM } from 'jsdom';
import { DiffDOM } from 'diff-dom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document } = dom.window;

const dd = new DiffDOM();

// Test 1: Simple text change
const test1a = document.createElement('div');
test1a.innerHTML = '<p>Hello</p>';
const test1b = document.createElement('div'); 
test1b.innerHTML = '<p>World</p>';

console.log('Test 1 - Simple text change:');
console.log('From:', test1a.innerHTML);
console.log('To:', test1b.innerHTML);
const diff1 = dd.diff(test1a.firstChild, test1b.firstChild);
console.log('Diff result:', JSON.stringify(diff1, null, 2));

// Test 2: Using elements directly
const el1 = document.createElement('div');
el1.innerHTML = '<h1>Hello World</h1>';
const el2 = document.createElement('div');
el2.innerHTML = '<h1>Hello Universe</h1>';

console.log('\nTest 2 - Direct element comparison:');
console.log('From:', el1.innerHTML);
console.log('To:', el2.innerHTML);
const diff2 = dd.diff(el1, el2);
console.log('Diff result:', JSON.stringify(diff2, null, 2));

// Test 3: Full HTML comparison
const html1 = `<div id="app">
  <h1>Hello World</h1>
  <p class="message">This is the original message</p>
</div>`;

const html2 = `<div id="app">
  <h1>Hello Universe</h1>
  <p class="message warning">This is the updated message</p>
  <button>Click me</button>
</div>`;

const c1 = document.createElement('div');
c1.innerHTML = html1;
const c2 = document.createElement('div');
c2.innerHTML = html2;

console.log('\nTest 3 - Full HTML comparison:');
const diff3 = dd.diff(c1.firstChild, c2.firstChild);
console.log('Diff result:', JSON.stringify(diff3, null, 2));