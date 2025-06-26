// minilive.js - Main entry point for the minilive package
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const mustache = require('mustache');
const connectionManager = require('./connection');

class MiniLive {
  constructor(options = {}) {
    this.options = {
      port: options.port || process.env.PORT || 3000,
      pagesDir: options.pagesDir || path.join(process.cwd(), 'pages'),
      logicDir: options.logicDir || path.join(process.cwd(), 'logic'),
      publicDir: options.publicDir || path.join(process.cwd(), 'public'),
      commandHandler: options.commandHandler || null,
      templateRewriter: options.templateRewriter || null,
      includes: options.includes || null,
      ...options
    };
    
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  setupMiddleware() {
    // Serve morphdom from this package's node_modules
    this.app.get('/minilive/morphdom.js', (req, res) => {
      const morphdomPath = require.resolve('morphdom/dist/morphdom-umd.js');
      res.sendFile(morphdomPath);
    });
    
    // Serve client.js from this package
    this.app.get('/minilive/client.js', (req, res) => {
      res.sendFile(path.join(__dirname, 'client.js'));
    });
    
    // User's public directory
    if (fs.existsSync(this.options.publicDir)) {
      this.app.use(express.static(this.options.publicDir));
    }
    
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
  }
  
  // Helper: Execute logic script with input
  executeLogic(page, input) {
    const logicPath = path.join(this.options.logicDir, `${page}.js`);
    
    try {
      // Read the script
      const script = fs.readFileSync(logicPath, 'utf8');
      
      // Create isolated context with input and output
      const sandbox = {
        input: input,
        output: {},
        console: console,
        require: require,
        global: global,
        process: process
      };
      
      // Execute in VM context
      const vm = require('vm');
      vm.createContext(sandbox);
      vm.runInContext(script, sandbox);
      
      return sandbox.output;
    } catch (err) {
      console.error(`Error in logic script ${page}.js:`, err);
      throw err;
    }
  }
  
  // Process commands
  async processCommands(commands, socket = null, res = null) {
    if (!commands || !Array.isArray(commands)) return;
    
    for (const cmd of commands) {
      const cmdType = cmd.type || cmd.command;
      
      // First, try custom command handler if provided
      if (this.options.commandHandler) {
        const handled = await this.options.commandHandler(cmd, { socket, res });
        if (handled) continue; // Skip built-in handling if custom handler returned true
      }
      
      // Built-in command handling
      switch (cmdType) {
        case 'redirect':
          if (res) {
            // HTTP response available
            res.redirect(cmd.location);
          } else if (socket) {
            // WebSocket connection
            socket.emit('command', { command: 'redirect', location: cmd.location });
          }
          break;
          
        case 'reload':
          if (socket) {
            socket.emit('command', { command: 'reload' });
          } else if (res) {
            // For HTTP, redirect to self
            res.redirect(res.req.originalUrl);
          }
          break;
          
        default:
          console.log('Unknown command:', cmdType);
      }
    }
  }
  
  // Helper: render a template with data
  renderTemplate(page, data, injectScripts = true, sessionId = null) {
    const templatePath = path.join(this.options.pagesDir, `${page}.mhtml`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${page}.mhtml not found`);
    }
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Apply template rewriter if provided
    if (this.options.templateRewriter) {
      template = this.options.templateRewriter(template, { page, data, sessionId });
    }
    
    // Inject required scripts if not present and injectScripts is true
    if (injectScripts) {
      // Check if socket.io script is present
      if (!template.includes('/socket.io/socket.io.js')) {
        // First, inject a small inline script that defines triggerEvent immediately
        const inlineScript = `<script>
    // Session ID for client-side use
    window._sessionId = '${sessionId}';
    
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
          let allIncludes = '';
          
          // Add custom includes if provided
          if (this.options.includes) {
            const pageIncludes = this.options.includes(page);
            if (Array.isArray(pageIncludes)) {
              pageIncludes.forEach(include => {
                if (typeof include === 'string') {
                  // Auto-detect type by extension
                  if (include.endsWith('.css')) {
                    allIncludes += `  <link rel="stylesheet" href="${include}">\n`;
                  } else if (include.endsWith('.js')) {
                    allIncludes += `  <script src="${include}"></script>\n`;
                  }
                } else if (typeof include === 'object') {
                  // Explicit type
                  if (include.type === 'css') {
                    allIncludes += `  <link rel="stylesheet" href="${include.src}">\n`;
                  } else if (include.type === 'js') {
                    allIncludes += `  <script src="${include.src}"${include.defer ? ' defer' : ''}${include.async ? ' async' : ''}></script>\n`;
                  } else if (include.type === 'inline-css') {
                    allIncludes += `  <style>${include.content}</style>\n`;
                  } else if (include.type === 'inline-js') {
                    allIncludes += `  <script>${include.content}</script>\n`;
                  }
                }
              });
            }
          }
          
          // Add MiniLive required scripts
          const scriptTags = `  <script src="/minilive/morphdom.js"></script>\n  <script src="/socket.io/socket.io.js"></script>\n  <script src="/minilive/client.js"></script>\n`;
          
          template = template.slice(0, headEndIndex) + allIncludes + scriptTags + template.slice(headEndIndex);
        }
      }
    }
    
    return mustache.render(template, data);
  }
  
  setupRoutes() {
    // Page routes
    this.app.get('/pages/:page', async (req, res, next) => {
      const page = req.params.page;
      
      try {
        // Check if logic file exists
        const logicPath = path.join(this.options.logicDir, `${page}.js`);
        if (!fs.existsSync(logicPath)) {
          return next();
        }
        
        // Get or create session ID from cookie
        let sessionId = req.cookies.sessionId;
        const isNewSession = !sessionId;
        if (!sessionId) {
          sessionId = connectionManager.generateSessionId();
        }
        
        // Check if we have stored input from a previous load
        const storedInput = !isNewSession ? connectionManager.getLastInput(sessionId, page) : null;
        
        let input;
        if (storedInput) {
          // Use stored input for seamless refresh
          console.log(`Using stored input for session ${sessionId} on page ${page}`);
          input = { ...storedInput };
          // Update request data with current request
          input.request = {
            method: req.method,
            headers: req.headers,
            query: req.query,
            params: req.params,
            url: req.url
          };
        } else {
          // Prepare fresh input for initial load
          input = {
            request: {
              method: req.method,
              headers: req.headers,
              query: req.query,
              params: req.params,
              url: req.url
            },
            ...req.query,
            event: 'onLoad'
          };
        }
        
        // Execute logic script
        const output = this.executeLogic(page, input);
        
        // Process commands if any
        if (output.commands) {
          await this.processCommands(output.commands, null, res);
          // If redirect command was issued, stop here
          if (output.commands.some(cmd => (cmd.type || cmd.command) === 'redirect')) {
            return;
          }
        }
        
        // Extract variables for rendering
        const variables = { ...output };
        delete variables.commands;
        
        // Set cookie if it's a new session
        if (isNewSession) {
          res.cookie('sessionId', sessionId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            sameSite: 'strict'
          });
          console.log('New session created:', sessionId);
        } else {
          console.log('Existing session found:', sessionId);
        }
        
        // Store the input for future refreshes
        connectionManager.updateLastInput(sessionId, page, input);
        
        // Render the page
        const html = this.renderTemplate(page, variables, true, sessionId);
        res.send(html);
        
      } catch (err) {
        console.error('Page route error:', err);
        next(err);
      }
    });
    
    // Admin endpoint for connection stats
    this.app.get('/admin/connections', (req, res) => {
      const stats = connectionManager.getStats();
      res.json({
        stats,
        connections: Array.from(connectionManager.connections.entries()).map(([sessionId, conn]) => ({
          sessionId,
          currentPage: conn.currentPage,
          connected: conn.socket && conn.socket.connected,
          lastActivity: new Date(conn.lastActivity).toISOString()
        }))
      });
    });
  }
  
  extractHeadData(html) {
    const headData = {};
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      headData.title = titleMatch[1];
    }
    
    // Extract meta tags
    const metaTags = {};
    const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["'][^>]*>/gi;
    let metaMatch;
    while ((metaMatch = metaRegex.exec(html)) !== null) {
      metaTags[metaMatch[1]] = metaMatch[2];
    }
    if (Object.keys(metaTags).length > 0) {
      headData.meta = metaTags;
    }
    
    // Extract style tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles = [];
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      styles.push(styleMatch[1]);
    }
    if (styles.length > 0) {
      headData.styles = styles;
    }
    
    return headData;
  }
  
  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);
      
      // Extract session ID from cookie via handshake
      const cookies = socket.handshake.headers.cookie || '';
      const sessionMatch = cookies.match(/sessionId=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;
      
      if (!sessionId) {
        console.error('No session ID in cookie for socket:', socket.id);
        socket.emit('error', { message: 'No session found. Please refresh the page.' });
        socket.disconnect(true);
        return;
      }
      
      // Wait for client to send page info
      socket.on('register', ({ currentPage }) => {
        console.log('Client registration:', { sessionId, currentPage });
        connectionManager.registerConnection(socket, sessionId, currentPage);
      });
      
      socket.on('event', async ({ page, eventType, payload }) => {
        try {
          // Get connection info
          const connectionInfo = connectionManager.getConnection(sessionId);
          if (!connectionInfo) {
            console.error('No connection found for session:', sessionId);
            socket.emit('error', { message: 'Session not found. Please refresh the page.' });
            return;
          }
          
          // Handle SPA navigation
          let input;
          if (eventType === 'navigate' && payload.targetPage) {
            page = payload.targetPage;
            connectionManager.updateCurrentPage(sessionId, page);
            
            // Check if we have stored input for this page (back button case)
            const storedInput = connectionManager.getLastInput(sessionId, page);
            if (storedInput) {
              // Use the stored input to restore exact previous state
              input = { ...storedInput };
              // Update request data with current
              input.request = {
                method: 'GET',
                headers: socket.handshake.headers,
                query: socket.handshake.query
              };
            } else {
              // No stored state, treat as fresh load
              input = {
                request: {
                  method: 'GET',
                  headers: socket.handshake.headers,
                  query: socket.handshake.query
                },
                ...socket.handshake.query,
                event: 'onLoad',
                payload: {}
              };
            }
          } else {
            // Regular event, not navigation
            input = {
              request: {
                method: 'GET',
                headers: socket.handshake.headers,
                query: socket.handshake.query
              },
              ...socket.handshake.query,
              event: eventType,
              payload: payload || {}
            };
          }
          
          // Execute the logic script
          const output = this.executeLogic(page, input);
          
          // Process commands if any
          if (output.commands) {
            await this.processCommands(output.commands, socket);
            if (output.commands.some(cmd => (cmd.type || cmd.command) === 'redirect')) {
              return;
            }
          }
          
          // Extract variables
          const variables = { ...output };
          delete variables.commands;
          
          // Check for changes
          const isNavigation = eventType === 'navigate';
          const pageStates = connectionManager.getPageStates(sessionId);
          const prevVariables = pageStates[page] || {};
          
          if (isNavigation || JSON.stringify(prevVariables) !== JSON.stringify(variables)) {
            connectionManager.updatePageState(sessionId, page, variables);
            connectionManager.updateLastInput(sessionId, page, input);
            
            const htmlNew = this.renderTemplate(page, variables, false);
            
            // Extract head metadata
            const headData = this.extractHeadData(htmlNew);
            
            // Extract body content
            const bodyMatch = htmlNew.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            const bodyContent = bodyMatch ? bodyMatch[1] : htmlNew;
            
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
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        connectionManager.handleDisconnect(socket.id);
      });
    });
  }
  
  serve(callback) {
    this.server.listen(this.options.port, () => {
      console.log(`🚀 MiniLive server listening on http://localhost:${this.options.port}`);
      if (callback) callback();
    });
    
    return this.server;
  }
}

// Export factory function for cleaner API
module.exports = function createMiniLive(options) {
  return new MiniLive(options);
};

// Also export the class for advanced usage
module.exports.MiniLive = MiniLive;