const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mustacheExpress = require('mustache-express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const mustache = require('mustache');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Mustache setup
app.engine('mhtml', mustacheExpress());
app.set('view engine', 'mhtml');
app.set('views', path.join(__dirname, 'pages'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Helper: Execute logic script with input
function executeLogic(page, input) {
  delete require.cache[require.resolve(`./logic/${page}.js`)];
  
  // Create a new context for the script
  const context = {
    input: input,
    output: null,
    console: console
  };
  
  // Read and execute the script
  const scriptPath = path.join(__dirname, 'logic', `${page}.js`);
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Execute in the context
  const script = new Function('input', 'output', 'console', scriptContent + '\nreturn output;');
  const result = script.call(context, input, null, console);
  
  return result || {};
}

// Helper: Process commands
async function processCommands(commands, socket, res) {
  if (!commands || !Array.isArray(commands)) return;
  
  for (const cmd of commands) {
    switch (cmd.type || cmd.command) {
      case 'redirect':
        if (socket) {
          socket.emit('command', { command: 'redirect', location: cmd.location });
        } else if (res) {
          res.redirect(cmd.location);
        }
        break;
      case 'setCookie':
        if (res) {
          res.cookie(cmd.name, cmd.value, cmd.options || {});
        }
        break;
    }
  }
}

// Helper: render a template with data
function renderTemplate(page, data, injectScripts = true) {
  const templatePath = path.join(__dirname, 'pages', `${page}.mhtml`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${page}.mhtml not found`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Inject required scripts if not present and injectScripts is true
  if (injectScripts) {
    // Check if socket.io script is present
    if (!template.includes('/socket.io/socket.io.js')) {
      // First, inject a small inline script that defines triggerEvent immediately
      const inlineScript = `<script>
    // Define triggerEvent immediately to prevent errors
    window.triggerEvent = window.triggerEvent || function() {
      console.log('triggerEvent called before client.js loaded, queueing...');
      window._eventQueue = window._eventQueue || [];
      window._eventQueue.push({ eventType: arguments[0], payload: arguments[1] || {} });
    };
  </script>
  `;
      
      // Find <head> tag and inject after it
      const headIndex = template.toLowerCase().indexOf('<head>');
      if (headIndex !== -1) {
        const headEndPos = template.indexOf('>', headIndex) + 1;
        template = template.slice(0, headEndPos) + '\n' + inlineScript + template.slice(headEndPos);
      }
      
      // Then inject the main scripts before </head>
      const headEndIndex = template.toLowerCase().indexOf('</head>');
      if (headEndIndex !== -1) {
        const scriptTags = `  <script src="/morphdom-umd.js"></script>\n  <script src="/socket.io/socket.io.js"></script>\n  <script src="/client.js"></script>\n`;
        template = template.slice(0, headEndIndex) + scriptTags + template.slice(headEndIndex);
      }
    }
  }
  
  return mustache.render(template, data);
}

// WebSocket connection handling
io.on('connection', (socket) => {
  // Store previous render data per page
  const pageStates = {};
  
  socket.on('event', async ({ page, eventType, payload }) => {
    try {
      // Prepare input for the logic script
      const input = {
        request: {
          method: 'GET',
          headers: socket.handshake.headers,
          query: socket.handshake.query
        },
        event: eventType,
        payload: payload || {}
      };
      
      // Execute the logic script
      const output = executeLogic(page, input);
      
      // Process commands if any
      if (output.commands) {
        await processCommands(output.commands, socket);
        // If there are commands but no redirect, continue to render
        if (output.commands.some(cmd => (cmd.type || cmd.command) === 'redirect')) {
          return;
        }
      }
      
      // Extract variables (everything except commands)
      const variables = { ...output };
      delete variables.commands;
      
      // Get previous state for this page
      const prevVariables = pageStates[page] || {};
      
      // Only send update if there are changes
      if (JSON.stringify(prevVariables) !== JSON.stringify(variables)) {
        // Store new state
        pageStates[page] = variables;
        
        // Render new HTML without script injection (since client already has scripts)
        const htmlNew = renderTemplate(page, variables, false);
        
        // Extract head metadata
        const headData = {};
        
        // Extract title
        const titleMatch = htmlNew.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) {
          headData.title = titleMatch[1];
        }
        
        // Extract meta tags
        const metaTags = {};
        const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["'][^>]*>/gi;
        let metaMatch;
        while ((metaMatch = metaRegex.exec(htmlNew)) !== null) {
          metaTags[metaMatch[1]] = metaMatch[2];
        }
        if (Object.keys(metaTags).length > 0) {
          headData.meta = metaTags;
        }
        
        // Extract just the body content
        const bodyMatch = htmlNew.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : htmlNew;
        
        // Send body content and head metadata to client
        socket.emit('update', { 
          html: bodyContent,
          head: headData
        });
      }
      
    } catch (err) {
      console.error('Socket event error:', err);
      socket.emit('error', { message: err.message });
    }
  });
});

// Page routes
app.get('/pages/:page', async (req, res, next) => {
  const page = req.params.page;
  
  try {
    // Check if logic file exists
    const logicPath = path.join(__dirname, 'logic', `${page}.js`);
    if (!fs.existsSync(logicPath)) {
      return next();
    }
    
    // Prepare input for initial load
    const input = {
      request: {
        method: req.method,
        headers: req.headers,
        query: req.query,
        params: req.params,
        url: req.url
      },
      event: 'onLoad'
    };
    
    // Execute logic script
    const output = executeLogic(page, input);
    
    // Process commands if any
    if (output.commands) {
      await processCommands(output.commands, null, res);
      // If redirect command was issued, stop here
      if (output.commands.some(cmd => (cmd.type || cmd.command) === 'redirect')) {
        return;
      }
    }
    
    // Extract variables for rendering
    const variables = { ...output };
    delete variables.commands;
    
    // Render the page using our custom function with script injection
    const html = renderTemplate(page, variables);
    res.send(html);
    
  } catch (err) {
    console.error('Page route error:', err);
    next(err);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));