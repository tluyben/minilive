import { JSDOM } from 'jsdom';
import morphdom from 'morphdom';

console.log('=== morphdom Demo ===\n');

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
const { document } = dom.window;

// morphdom needs global window/document/HTMLElement
global.window = dom.window;
global.document = document;
global.HTMLElement = dom.window.HTMLElement;

const container = document.createElement('div');
container.innerHTML = html1;
const fromNode = container.firstElementChild;

container.innerHTML = html2;
const toNode = container.firstElementChild;

document.body.appendChild(fromNode);

console.log('Before morphing:');
console.log(fromNode.outerHTML);

let addedNodes = [];
let removedNodes = [];
let modifiedNodes = [];

morphdom(fromNode, toNode, {
  onNodeAdded: function(node) {
    if (node.nodeType === 1) {
      addedNodes.push(node.tagName + (node.id ? '#' + node.id : ''));
    }
    return node;
  },
  onNodeRemoved: function(node) {
    if (node.nodeType === 1) {
      removedNodes.push(node.tagName + (node.id ? '#' + node.id : ''));
    }
  },
  onElUpdated: function(el) {
    modifiedNodes.push(el.tagName + (el.id ? '#' + el.id : ''));
  },
  onBeforeNodeAdded: function(node) {
    console.log('Adding node:', node.nodeType === 1 ? node.tagName : 'text node');
    return node;
  },
  onBeforeNodeDiscarded: function(node) {
    console.log('Discarding node:', node.nodeType === 1 ? node.tagName : 'text node');
    return true;
  },
  onBeforeElUpdated: function(fromEl, toEl) {
    console.log('Updating element:', fromEl.tagName);
    return true;
  }
});

console.log('\nAfter morphing:');
console.log(fromNode.outerHTML);

console.log('\nSummary:');
console.log('Added nodes:', addedNodes);
console.log('Removed nodes:', removedNodes);
console.log('Modified nodes:', modifiedNodes);

console.log('\n=== morphdom with preservation example ===\n');

const preserveHtml1 = `
<div id="app">
  <input type="text" value="User input" />
  <div data-preserve="true">This should be preserved</div>
  <p>This will change</p>
</div>`;

const preserveHtml2 = `
<div id="app">
  <input type="text" value="New default" />
  <div data-preserve="true">This text is different but won't update</div>
  <p>This has changed</p>
</div>`;

const preserveContainer = document.createElement('div');
preserveContainer.innerHTML = preserveHtml1;
const preserveFrom = preserveContainer.firstElementChild;

preserveContainer.innerHTML = preserveHtml2;
const preserveTo = preserveContainer.firstElementChild;

preserveFrom.querySelector('input').value = 'User typed this!';

console.log('Before morphing (with user input):');
console.log(preserveFrom.outerHTML);

morphdom(preserveFrom, preserveTo, {
  onBeforeElUpdated: function(fromEl, toEl) {
    if (fromEl.hasAttribute('data-preserve')) {
      return false;
    }
    if (fromEl.tagName === 'INPUT' && fromEl.value !== toEl.value) {
      console.log(`Preserving input value: "${fromEl.value}" instead of "${toEl.value}"`);
      toEl.value = fromEl.value;
    }
    return true;
  }
});

console.log('\nAfter morphing (note preserved elements):');
console.log(preserveFrom.outerHTML);