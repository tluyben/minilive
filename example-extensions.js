// Example: Using MiniLive with custom extensions

const minilive = require('./minilive-package');

const server = minilive({
  port: 3000,
  
  // Custom command handler
  commandHandler: async (cmd, { socket, res }) => {
    // Example: Handle a custom 'notify' command
    if (cmd.type === 'notify') {
      if (socket) {
        // Send notification to client
        socket.emit('notification', {
          message: cmd.message,
          type: cmd.level || 'info'
        });
      }
      return true; // Handled, skip built-in processing
    }
    
    // Example: Intercept redirects to add logging
    if (cmd.type === 'redirect') {
      console.log(`Custom redirect handler: ${cmd.location}`);
      // Return false to let built-in handler process it
      return false;
    }
    
    // Not handled by custom handler
    return false;
  },
  
  // Template rewriter
  templateRewriter: (template, { page, data, sessionId }) => {
    // Example: Add a custom header to all pages
    if (!template.includes('<!-- custom-header -->')) {
      template = template.replace(
        '<body>',
        `<body>
  <!-- custom-header -->
  <div style="background: #f0f0f0; padding: 10px; text-align: center;">
    Session: ${sessionId} | Page: ${page}
  </div>`
      );
    }
    
    // Example: Replace custom syntax
    template = template.replace(/\{\{@user\}\}/g, data.username || 'Guest');
    
    // Example: Add analytics script
    if (!template.includes('analytics.js')) {
      template = template.replace(
        '</body>',
        '  <script src="/analytics.js"></script>\n</body>'
      );
    }
    
    return template;
  }
});

server.serve(() => {
  console.log('MiniLive server with extensions running!');
});

// Usage in logic files:
// output.commands = [
//   { type: 'notify', message: 'Welcome!', level: 'success' },
//   { type: 'redirect', location: '/pages/home' }
// ];