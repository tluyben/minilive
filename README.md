# MiniLive: Server-Driven Live UI Framework

## Overview

MiniLive is a minimalist Node.js/Express framework for building server-driven, real-time web applications. It combines:

1. **Server-side logic execution** - JavaScript files that receive input and return output
2. **Mustache templates** - Simple HTML templates with variable substitution
3. **WebSocket communication** - Real-time updates without page reloads
4. **Automatic script injection** - Required client scripts are injected automatically

## Architecture

### Request Flow

1. User navigates to `/pages/example`
2. Server executes `logic/example.js` with input containing request details and event type
3. Logic returns JSON with variables and optional commands
4. Server renders `pages/example.mhtml` with the variables
5. Client establishes WebSocket connection for live updates

### Live Updates

When users interact with the page:
1. Client sends event via WebSocket
2. Server re-executes logic with new input
3. Server renders updated HTML
4. Client receives and applies updates seamlessly

## Project Structure

```
minilive/
├── index.js                # Express + Socket.IO server
├── package.json           
├── pages/                  # Mustache HTML templates (.mhtml)
│   ├── login.mhtml        
│   └── dashboard.mhtml    
├── logic/                  # Server-side logic files
│   ├── login.js           
│   └── dashboard.js       
└── public/                 # Static assets
    └── client.js          # WebSocket client (auto-injected)
```

## Logic Files

Logic files are pure JavaScript that receive `input` and set `output`:

```javascript
// logic/example.js
console.log('Input:', input);

// The input object contains:
// {
//   request: { method, headers, query, params, url },
//   event: 'onLoad' | 'customEvent',
//   payload: { ...eventData }
// }

output = {
  // Variables for template rendering
  title: 'My Page',
  message: 'Hello World',
  
  // Optional commands
  commands: [
    { type: 'redirect', location: '/pages/other' },
    { type: 'setCookie', name: 'token', value: 'abc123' }
  ]
};
```

## Template Files

Templates use Mustache syntax and don't need to include Socket.IO or client scripts:

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{message}}</h1>
  
  <button onclick="triggerEvent('refresh')">
    Refresh
  </button>
  
  {{#items}}
    <li>{{name}}</li>
  {{/items}}
</body>
</html>
```

The framework automatically injects:
- `/socket.io/socket.io.js` - WebSocket library
- `/client.js` - Event handling and live updates

## Client API

The client provides a simple `triggerEvent` function:

```javascript
// Trigger an event with optional payload
triggerEvent('login', {
  email: 'user@example.com',
  password: 'secret'
});

triggerEvent('refresh');
triggerEvent('delete', { id: 123 });
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Create a new page**:
   - Add `logic/mypage.js` with your server logic
   - Add `pages/mypage.mhtml` with your template
   - Navigate to `http://localhost:3000/pages/mypage`

## Example: Login Page

**logic/login.js**:
```javascript
output = {
  title: 'Login',
  error: null
};

if (input.event === 'login') {
  const { email, password } = input.payload;
  
  if (email === 'test@example.com' && password === 'password') {
    output.commands = [{
      type: 'redirect',
      location: '/pages/dashboard'
    }];
  } else {
    output.error = 'Invalid credentials';
  }
}
```

**pages/login.mhtml**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  {{#error}}
    <p style="color: red">{{error}}</p>
  {{/error}}
  
  <form onsubmit="return false">
    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Password">
    <button onclick="triggerEvent('login', {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })">Login</button>
  </form>
</body>
</html>
```

## Features

- **Zero client-side state management** - All state lives on the server
- **Simple mental model** - Input → Logic → Output
- **Live updates** - Changes appear instantly without refresh
- **No build step** - Just write JavaScript and HTML
- **Automatic script injection** - Framework handles the plumbing
- **Command system** - Redirect, set cookies, and more

## Commands

Logic files can return commands that are executed by the framework:

### Redirect
```javascript
output.commands = [{
  type: 'redirect',
  location: '/pages/dashboard'
}];
```

### Set Cookie
```javascript
output.commands = [{
  type: 'setCookie',
  name: 'session',
  value: 'abc123',
  options: { httpOnly: true }
}];
```

### Multiple Commands
```javascript
output.commands = [
  { type: 'setCookie', name: 'token', value: 'xyz' },
  { type: 'redirect', location: '/pages/home' }
];
```

## Tips

1. **Logic files are stateless** - Each execution is independent
2. **Use commands for side effects** - Don't modify global state
3. **Keep templates simple** - Logic belongs in logic files
4. **Events are flexible** - Create custom events for any interaction

## License

MIT