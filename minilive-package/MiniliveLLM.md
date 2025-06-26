# MiniLive Framework - Complete LLM Documentation

## Overview

MiniLive is a server-driven UI framework that enables real-time web applications with seamless state management. After `npm install minilive`, you can create dynamic web applications where all logic lives on the server, and the client automatically updates via WebSockets.

## Core Concepts

### 1. Server-Driven Architecture
- **All logic runs on the server** in JavaScript files
- **Templates are Mustache-based** HTML files (.mhtml)
- **Client receives updates** via WebSocket and applies them using morphdom
- **No client-side JavaScript required** (except what MiniLive provides)

### 2. Project Structure
```
your-project/
├── index.js          # Entry point - creates MiniLive server
├── pages/            # HTML templates (.mhtml files)
│   ├── home.mhtml
│   └── dashboard.mhtml
├── logic/            # Server-side logic (.js files)
│   ├── home.js
│   └── dashboard.js
└── public/           # Optional static assets
```

### 3. How It Works

1. **User visits** `/pages/home`
2. **Server executes** `logic/home.js` with an `input` object
3. **Logic returns** an `output` object with data and optional commands
4. **Server renders** `pages/home.mhtml` with the output data
5. **Client receives** HTML with auto-injected scripts for real-time updates
6. **User interactions** trigger events that go back to server logic
7. **Server sends updates** via WebSocket, client applies them seamlessly

## Complete Implementation Guide

### Step 1: Create Server (index.js)

```javascript
const minilive = require('minilive');

const server = minilive({
  port: 3000,                    // Optional, defaults to 3000
  pagesDir: './pages',           // Optional, defaults to './pages'
  logicDir: './logic',           // Optional, defaults to './logic'
  publicDir: './public',         // Optional, defaults to './public'
  
  // Optional: Custom command handler
  commandHandler: async (cmd, { socket, res }) => {
    if (cmd.type === 'myCustomCommand') {
      // Handle custom command
      return true; // Skip built-in processing
    }
    return false; // Continue with built-in handler
  },
  
  // Optional: Template preprocessor
  templateRewriter: (template, { page, data, sessionId }) => {
    // Modify template before rendering
    return template;
  },
  
  // Optional: Page-specific includes (CSS/JS)
  includes: (page) => {
    // Return array of includes for this page
    // These are injected on initial page load only
    if (page === 'dashboard') {
      return [
        '/css/dashboard.css',
        'https://cdn.example.com/charts.js',
        { type: 'js', src: '/js/analytics.js', defer: true }
      ];
    }
    return []; // No includes for other pages
  }
});

server.serve();
```

### Step 2: Create Logic Files (logic/*.js)

Logic files receive an `input` object and must set an `output` object:

```javascript
// logic/home.js

// Input object structure:
// input = {
//   request: { method, headers, query, params, url },
//   event: 'onLoad' | 'eventName',  // onLoad for initial page load
//   payload: {},                     // Data from triggerEvent()
//   ...queryParams                   // Flattened query parameters
// }

// Initialize output
output = {
  // Data for template rendering
  title: 'Home Page',
  message: 'Welcome!',
  items: ['Item 1', 'Item 2'],
  
  // Optional: Commands array
  commands: [
    { type: 'redirect', location: '/pages/dashboard' },
    { type: 'reload' },
    // Custom commands if you have a commandHandler
    { type: 'notify', message: 'Hello!' }
  ]
};

// Handle different events
if (input.event === 'onLoad') {
  // Initial page load
  output.message = 'Page loaded at ' + new Date().toLocaleString();
  
} else if (input.event === 'buttonClick') {
  // Handle button click
  output.message = 'Button clicked! Payload: ' + JSON.stringify(input.payload);
  
} else if (input.event === 'formSubmit') {
  // Handle form submission
  const { name, email } = input.payload;
  if (name && email) {
    output.message = `Thanks ${name}! We'll contact you at ${email}`;
    output.commands = [{ type: 'redirect', location: '/pages/success' }];
  } else {
    output.message = 'Please fill all fields';
  }
}

// Global state example (persists across requests)
if (!global.visitCount) global.visitCount = 0;
global.visitCount++;
output.visitCount = global.visitCount;
```

### Step 3: Create Templates (pages/*.mhtml)

Templates use Mustache syntax with automatic script injection:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
  <style>
    /* Page-specific styles */
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .button { padding: 10px 20px; margin: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h1>{{title}}</h1>
    <p>{{message}}</p>
    
    <!-- Simple event trigger -->
    <button onclick="triggerEvent('buttonClick')">Click Me</button>
    
    <!-- Event with payload -->
    <button onclick="triggerEvent('buttonClick', { action: 'delete', id: 123 })">
      Delete Item 123
    </button>
    
    <!-- Form handling -->
    <form onsubmit="event.preventDefault(); triggerEvent('formSubmit', {
      name: this.name.value,
      email: this.email.value
    })">
      <input name="name" placeholder="Name" required>
      <input name="email" type="email" placeholder="Email" required>
      <button type="submit">Submit</button>
    </form>
    
    <!-- Iterate over arrays -->
    <ul>
      {{#items}}
        <li>{{.}}</li>
      {{/items}}
    </ul>
    
    <!-- Conditional rendering -->
    {{#showSecret}}
      <p>Secret message: {{secretMessage}}</p>
    {{/showSecret}}
    
    <!-- Visit counter -->
    <p>Total visits: {{visitCount}}</p>
  </div>
</body>
</html>
```

## Key Features

### 1. Session Management
- **Automatic session cookies** (30-day expiry)
- **Session persists across**: refreshes, reconnections, and navigation
- **Each session tracks**: current page, page states, and last inputs

### 2. State Persistence
- **Page refresh maintains exact state** - refreshing shows the same content
- **Browser back/forward preserves state** - navigation restores previous states
- **WebSocket reconnection is seamless** - disconnections don't lose state

### 3. SPA-like Navigation
- **No page reloads** when using redirect commands
- **URL updates** properly for bookmarking
- **Styles and scripts** are dynamically updated per page

### 4. Real-time Updates
- **Automatic WebSocket connection** for each client
- **Efficient DOM updates** using morphdom (only changed elements update)
- **Input preservation** - form values, scroll position, focus maintained

### 5. Built-in Commands

```javascript
output.commands = [
  // Redirect (SPA-style, no page reload)
  { type: 'redirect', location: '/pages/dashboard' },
  
  // Reload current page
  { type: 'reload' },
  
  // Custom commands (requires commandHandler)
  { type: 'yourCommand', ...data }
];
```

## Advanced Patterns

### 1. Shared State Between Pages

```javascript
// logic/shared.js - Common functionality
module.exports = {
  getUserData: (sessionId) => {
    global.users = global.users || {};
    return global.users[sessionId] || { name: 'Guest' };
  },
  
  setUserData: (sessionId, data) => {
    global.users = global.users || {};
    global.users[sessionId] = data;
  }
};

// logic/profile.js
const shared = require('./shared');

output = {
  user: shared.getUserData(input.sessionId)
};
```

### 2. Real-time Notifications

```javascript
// In your server setup
const server = minilive({
  commandHandler: async (cmd, { socket, res }) => {
    if (cmd.type === 'broadcast') {
      // Get all connections on current page
      const connections = connectionManager.getConnectionsOnPage(cmd.page);
      connections.forEach(({ connection }) => {
        if (connection.socket && connection.socket.connected) {
          connection.socket.emit('notification', cmd.data);
        }
      });
      return true;
    }
    return false;
  }
});
```

### 3. File Uploads

```javascript
// Add to your custom server setup before minilive
app.post('/upload', upload.single('file'), (req, res) => {
  // Handle file upload
  res.json({ filename: req.file.filename });
});
```

### 4. Authentication Pattern

```javascript
// logic/protected.js
if (!global.sessions?.[input.sessionId]?.authenticated) {
  output.commands = [{ type: 'redirect', location: '/pages/login' }];
  return;
}

// Protected page content
output.secretData = 'Only for authenticated users';
```

## Client-Side API

MiniLive automatically injects these functions:

### triggerEvent(eventType, payload)
Sends an event to server logic:
```javascript
// Simple event
triggerEvent('refresh')

// With data
triggerEvent('updateProfile', { name: 'John', age: 30 })

// From form
triggerEvent('submit', Object.fromEntries(new FormData(form)))
```

### window._sessionId
The current session ID (useful for client-side analytics):
```javascript
console.log('Session:', window._sessionId);
```

## Troubleshooting

### 1. Page Not Found
- Ensure both `logic/pagename.js` and `pages/pagename.mhtml` exist
- File names must match exactly (case-sensitive)

### 2. State Not Persisting
- Check that cookies are enabled
- Verify sessionId is being set (check browser DevTools > Application > Cookies)

### 3. WebSocket Connection Issues
- Ensure no firewall/proxy blocking WebSocket
- Check browser console for connection errors

### 4. Template Not Updating
- Logic must modify the `output` object, not return values
- Ensure no JavaScript errors in logic files

### 5. Events Not Working
- Use `triggerEvent()` not custom JavaScript
- Check browser console for errors
- Verify WebSocket is connected

## Complete Example: Todo App

**index.js:**
```javascript
const minilive = require('minilive');
minilive({ port: 3000 }).serve();
```

**logic/todos.js:**
```javascript
// Initialize todos in global state
global.todos = global.todos || [];

output = {
  title: 'Todo App',
  todos: global.todos
};

if (input.event === 'addTodo') {
  const { text } = input.payload;
  if (text) {
    global.todos.push({
      id: Date.now(),
      text,
      done: false
    });
  }
} else if (input.event === 'toggleTodo') {
  const { id } = input.payload;
  const todo = global.todos.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
} else if (input.event === 'deleteTodo') {
  const { id } = input.payload;
  global.todos = global.todos.filter(t => t.id !== id);
}

output.todos = global.todos;
output.remaining = global.todos.filter(t => !t.done).length;
```

**pages/todos.mhtml:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
  <style>
    .done { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  
  <form onsubmit="event.preventDefault(); triggerEvent('addTodo', { text: this.todo.value }); this.todo.value = '';">
    <input name="todo" placeholder="Add todo..." required>
    <button type="submit">Add</button>
  </form>
  
  <ul>
    {{#todos}}
    <li class="{{#done}}done{{/done}}">
      <input type="checkbox" {{#done}}checked{{/done}} 
             onchange="triggerEvent('toggleTodo', { id: {{id}} })">
      {{text}}
      <button onclick="triggerEvent('deleteTodo', { id: {{id}} })">Delete</button>
    </li>
    {{/todos}}
  </ul>
  
  <p>{{remaining}} items remaining</p>
</body>
</html>
```

## Performance Considerations

1. **Global State**: Use sparingly, consider external database for large data
2. **Large Lists**: Implement pagination in logic files
3. **File Uploads**: Handle separately from WebSocket connection
4. **Broadcasting**: Be selective about which pages/users receive updates

## Security Notes

1. **All logic runs server-side** - no client access to business logic
2. **Session cookies are httpOnly** - not accessible to client JavaScript
3. **Input validation** - always validate in logic files
4. **Template injection** - Mustache escapes HTML by default
5. **Use {{{unescaped}}}** only when necessary

This completes the comprehensive guide to using MiniLive after `npm install minilive`.