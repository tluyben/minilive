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

### Prepend/Postpend JavaScript

Add JavaScript code that runs before or after your logic scripts:

```javascript
const server = minilive({
  prepend: `
    // This code runs before every logic script
    const helpers = {
      formatDate: (date) => new Date(date).toLocaleDateString(),
      capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1)
    };
    
    // Make helpers available to all logic scripts
    const h = helpers;
  `,
  postpend: `
    // This code runs after every logic script
    if (output.debug) {
      console.log('Debug output:', output);
    }
    
    // Add timestamp to all responses
    output._timestamp = new Date().toISOString();
  `
});
```

This feature is useful for:
- Sharing common utilities across all logic scripts
- Adding debugging or logging functionality
- Injecting global configuration or constants
- Post-processing output data
- Setting up common error handlers

Example logic script using prepended helpers:
```javascript
// logic/profile.js
output = {
  username: input.username,
  joinDate: h.formatDate(input.joinDate), // Uses prepended helper
  displayName: h.capitalize(input.username)
};
```

## Partials

MiniLive supports Mustache partials for reusable template components. Partials allow you to break your templates into smaller, reusable pieces.

### Basic Usage

Create partial files in your pages directory with the `.mhtml` extension:

```
pages/
├── home.mhtml
├── header.mhtml        # Partial
├── footer.mhtml        # Partial
└── components/
    └── user-card.mhtml # Nested partial
```

Reference partials in your templates using `{{> partialName}}`:

```html
<!-- pages/home.mhtml -->
<!DOCTYPE html>
<html>
<body>
  {{> header}}
  
  <main>
    <h1>{{title}}</h1>
    {{#users}}
      {{> components/user-card}}
    {{/users}}
  </main>
  
  {{> footer}}
</body>
</html>
```

```html
<!-- pages/header.mhtml -->
<header>
  <nav>
    <a href="/">Home</a>
    {{#isLoggedIn}}
      <span>Welcome, {{username}}!</span>
    {{/isLoggedIn}}
  </nav>
</header>
```

```html
<!-- pages/components/user-card.mhtml -->
<div class="user-card">
  <img src="{{avatar}}" alt="{{name}}" />
  <h3>{{name}}</h3>
  <p>{{bio}}</p>
</div>
```

### Important Notes

1. **File Resolution**: Partials are resolved relative to the `pagesDir` directory
2. **Extension**: The `.mhtml` extension is automatically added - don't include it in the partial reference
3. **Nested Partials**: Partials can include other partials (recursive loading is supported)
4. **Error Handling**: Missing partials will throw an error with the expected file path
5. **Data Context**: Partials inherit the data context from their parent template

### Logic Script Requirements

Your logic scripts must provide data for both the main template AND all referenced partials:

```javascript
// logic/home.js
output = {
  // Main template data
  title: 'My App',
  
  // Header partial data
  isLoggedIn: true,
  username: 'John Doe',
  
  // User cards data
  users: [
    {
      name: 'Alice',
      avatar: '/images/alice.jpg',
      bio: 'Frontend Developer'
    },
    {
      name: 'Bob',
      avatar: '/images/bob.jpg',
      bio: 'Backend Developer'
    }
  ],
  
  // Footer partial data
  copyrightYear: new Date().getFullYear(),
  companyName: 'My Company'
};
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