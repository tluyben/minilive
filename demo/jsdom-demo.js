import { JSDOM } from 'jsdom';

console.log('=== JSDOM Demo ===\n');

const html1 = `
<!DOCTYPE html>
<html>
<head><title>Document 1</title></head>
<body>
  <div id="app">
    <h1>Hello World</h1>
    <p class="message">This is the original message</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </div>
</body>
</html>`;

const html2 = `
<!DOCTYPE html>
<html>
<head><title>Document 2</title></head>
<body>
  <div id="app">
    <h1>Hello Universe</h1>
    <p class="message warning">This is the updated message</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
    <button>Click me</button>
  </div>
</body>
</html>`;

const dom1 = new JSDOM(html1);
const dom2 = new JSDOM(html2);

console.log('Document 1 title:', dom1.window.document.title);
console.log('Document 1 h1:', dom1.window.document.querySelector('h1').textContent);
console.log('Document 1 items:', dom1.window.document.querySelectorAll('li').length);

console.log('\nDocument 2 title:', dom2.window.document.title);
console.log('Document 2 h1:', dom2.window.document.querySelector('h1').textContent);
console.log('Document 2 items:', dom2.window.document.querySelectorAll('li').length);
console.log('Document 2 has button:', !!dom2.window.document.querySelector('button'));

const { document } = dom1.window;
const h1 = document.querySelector('h1');
h1.textContent = 'Modified via JSDOM!';
h1.style.color = 'red';

console.log('\nModified Document 1 HTML:');
console.log(document.querySelector('#app').outerHTML);