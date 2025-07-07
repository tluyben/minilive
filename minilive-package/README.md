# MiniLive

Server-driven UI framework with live updates and seamless state management.

## Installation

```bash
npm install minilive
```

## Quick Start

1. Create your project structure:
```
my-app/
├── index.js
├── pages/
│   └── home.mhtml
└── logic/
    └── home.js
```

2. Create `index.js`:
```javascript
const minilive = require('minilive');

const server = minilive({
  port: 3000
});

server.serve();
```

3. Create `pages/home.mhtml`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{message}}</h1>
  <button onclick="triggerEvent('click')">Click me</button>
</body>
</html>
```

4. Create `logic/home.js`:
```javascript
output = {
  title: 'MiniLive Demo',
  message: 'Hello World!'
};

if (input.event === 'click') {
  output.message = 'Button clicked!';
}
```

5. Run:
```bash
node index.js
```

Visit http://localhost:3000/pages/home

## What's Included

When you install minilive, you get:
- Express server with WebSocket support
- Morphdom for efficient DOM updates
- Session management with cookies
- SPA navigation without page reloads
- Automatic script injection
- State persistence across refreshes

All client-side assets (morphdom, client.js) are served automatically from the package.

## Advanced Options

### Custom Command Handler

Extend the command system with your own commands:

```javascript
const server = minilive({
  commandHandler: async (cmd, { socket, res }) => {
    if (cmd.type === 'customCommand') {
      // Handle your custom command
      return true; // Return true to skip built-in processing
    }
    return false; // Let built-in handler process it
  }
});
```

### Template Rewriter

Preprocess templates before rendering:

```javascript
const server = minilive({
  templateRewriter: (template, { page, data, sessionId }) => {
    // Modify template here
    return template.replace('{{customTag}}', 'replaced');
  }
});
```

### Page-Specific Includes

Add CSS and JavaScript files per page:

```javascript
const server = minilive({
  includes: (page) => {
    if (page === 'dashboard') {
      return [
        '/css/dashboard.css',
        'https://cdn.example.com/charts.js',
        { type: 'js', src: '/js/analytics.js', defer: true }
      ];
    }
    return [];
  }
});
```

## Testing

### testLogic Function

Test your page logic without running the full server:

```javascript
const { testLogic } = require('minilive');

// Test a page with JSON input
const result = await testLogic('home', { 
  event: 'click',
  userId: 123 
});

console.log(result); // Returns the output object from the logic script
```

**Parameters:**
- `pageName`: Page name without `.js` extension (e.g., 'login', 'dashboard')
- `jsonInput`: JSON object to pass as `input` to the logic script
- `options`: Optional config object with `logicDir` (defaults to `./logic`)

**Example test:**
```javascript
const { testLogic } = require('minilive');

async function testHomePage() {
  try {
    // Test initial load
    const initialState = await testLogic('home', { event: 'onLoad' });
    console.log('Initial state:', initialState);
    
    // Test button click
    const clickState = await testLogic('home', { event: 'click' });
    console.log('After click:', clickState);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testHomePage();
```

This function uses the same VM execution environment as the live server, ensuring your tests match production behavior exactly.