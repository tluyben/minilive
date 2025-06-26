// Simple client without external dependencies

// Create a queue for events that are triggered before socket is ready
window._eventQueue = window._eventQueue || [];

// Make triggerEvent available immediately
window.triggerEvent = function(eventType, payload = {}) {
  if (window._socket && window._socket.connected) {
    const page = getCurrentPage();
    console.log('Triggering event:', eventType, 'for page:', page, 'with payload:', payload);
    window._socket.emit('event', {
      page: page,
      eventType: eventType,
      payload: payload
    });
  } else {
    // Queue the event if socket isn't ready
    window._eventQueue.push({ eventType, payload });
  }
};

// Get current page name from URL
function getCurrentPage() {
  const path = window.location.pathname;
  const match = path.match(/^\/pages\/(.+)$/);
  return match ? match[1] : 'index';
}

window.addEventListener('DOMContentLoaded', function() {
  // Initialize Socket.IO connection
  const socket = io();
  window._socket = socket;

  // Listen for HTML updates from server
  socket.on('update', ({ html, head }) => {
    console.log('Update received, applying intelligent patch...');
    
    // Create a temporary body element with the new content
    const newBody = document.createElement('body');
    newBody.innerHTML = html;
    
    // Use morphdom to intelligently update the body
    // This preserves event listeners, form input state, focus, etc.
    morphdom(document.body, newBody, {
      onBeforeElUpdated: function(fromEl, toEl) {
        // Preserve form element states
        if (fromEl.tagName === 'INPUT') {
          switch (fromEl.type) {
            case 'checkbox':
            case 'radio':
              toEl.checked = fromEl.checked;
              break;
            case 'password':
              // Optionally preserve password fields
              if (fromEl.value !== '') {
                toEl.value = fromEl.value;
              }
              break;
            default:
              toEl.value = fromEl.value;
          }
        } else if (fromEl.tagName === 'TEXTAREA') {
          toEl.value = fromEl.value;
        } else if (fromEl.tagName === 'SELECT') {
          // Preserve selected options
          const selectedValues = Array.from(fromEl.selectedOptions).map(o => o.value);
          Array.from(toEl.options).forEach(option => {
            option.selected = selectedValues.includes(option.value);
          });
        }
        
        // Preserve focus and cursor position
        if (fromEl === document.activeElement) {
          const tagName = fromEl.tagName;
          if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
            const start = fromEl.selectionStart;
            const end = fromEl.selectionEnd;
            const direction = fromEl.selectionDirection;
            
            setTimeout(() => {
              toEl.focus();
              // Restore cursor position
              if (toEl.setSelectionRange && start !== null && end !== null) {
                toEl.setSelectionRange(start, end, direction);
              }
            }, 0);
          } else {
            setTimeout(() => toEl.focus(), 0);
          }
        }
        
        // Preserve scroll positions
        if (fromEl.scrollTop > 0 || fromEl.scrollLeft > 0) {
          toEl.scrollTop = fromEl.scrollTop;
          toEl.scrollLeft = fromEl.scrollLeft;
        }
        
        // Preserve custom data attributes that might be used by JavaScript
        if (fromEl.dataset) {
          Object.keys(fromEl.dataset).forEach(key => {
            if (key.startsWith('preserve') || key.startsWith('state')) {
              toEl.dataset[key] = fromEl.dataset[key];
            }
          });
        }
        
        // Skip updating if element has data-preserve attribute
        if (fromEl.hasAttribute('data-preserve')) {
          return false;
        }
        
        // Preserve contenteditable content
        if (fromEl.contentEditable === 'true' && fromEl.innerHTML !== toEl.innerHTML) {
          toEl.innerHTML = fromEl.innerHTML;
        }
        
        // Preserve details/summary open state
        if (fromEl.tagName === 'DETAILS') {
          toEl.open = fromEl.open;
        }
        
        // Preserve dialog open state
        if (fromEl.tagName === 'DIALOG') {
          if (fromEl.open && !toEl.open) {
            setTimeout(() => toEl.showModal(), 0);
          } else if (!fromEl.open && toEl.open) {
            toEl.close();
          }
        }
        
        return true;
      },
      onNodeAdded: function(node) {
        // Handle any animations for new nodes
        if (node.nodeType === 1 && node.classList) {
          node.style.opacity = '0';
          setTimeout(() => {
            node.style.transition = 'opacity 0.3s';
            node.style.opacity = '1';
          }, 10);
        }
      }
    });
    
    // Update head metadata if provided
    if (head) {
      // Update title
      if (head.title !== undefined) {
        document.title = head.title;
      }
      
      // Update meta tags
      if (head.meta) {
        Object.entries(head.meta).forEach(([name, content]) => {
          // Try to find existing meta tag
          let metaTag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          
          if (!metaTag) {
            // Create new meta tag if it doesn't exist
            metaTag = document.createElement('meta');
            // Use 'property' for Open Graph tags, 'name' for others
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
              metaTag.setAttribute('property', name);
            } else {
              metaTag.setAttribute('name', name);
            }
            document.head.appendChild(metaTag);
          }
          
          metaTag.setAttribute('content', content);
        });
      }
      
      // Update styles (for SPA navigation)
      if (head.styles) {
        // Remove all existing page-specific styles (keep global styles)
        document.querySelectorAll('style[data-page-style]').forEach(style => {
          style.remove();
        });
        
        // Add new styles
        head.styles.forEach((styleContent, index) => {
          const styleTag = document.createElement('style');
          styleTag.setAttribute('data-page-style', 'true');
          styleTag.textContent = styleContent;
          document.head.appendChild(styleTag);
        });
      }
    }
  });

  // Listen for commands from server
  socket.on('command', (data) => {
    console.log('Command received:', data);
    switch (data.command) {
      case 'redirect':
        // SPA navigation - request new page content instead of hard redirect
        const targetPath = data.location;
        const match = targetPath.match(/^\/pages\/(.+)$/);
        if (match) {
          const targetPage = match[1];
          console.log('SPA navigating to:', targetPage);
          
          // Update URL without reload
          history.pushState({ page: targetPage }, '', targetPath);
          
          // Request the new page content
          window.triggerEvent('navigate', { targetPage: targetPage });
        } else {
          // Fallback to hard redirect for non-page URLs
          window.location.href = data.location;
        }
        break;
      case 'reload':
        window.location.reload();
        break;
      default:
        console.log('Unknown command:', data.command);
    }
  });

  // Listen for errors
  socket.on('error', ({ message }) => {
    console.error('Server error:', message);
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Connected to server');
    
    // Register this connection with current page
    const currentPage = getCurrentPage();
    socket.emit('register', { currentPage });
    console.log('Registered on page:', currentPage);
    
    // Process any queued events
    while (window._eventQueue.length > 0) {
      const { eventType, payload } = window._eventQueue.shift();
      window.triggerEvent(eventType, payload);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
      console.log('Browser navigation to:', event.state.page);
      window.triggerEvent('navigate', { targetPage: event.state.page });
    }
  });
  
  // Set initial state
  const currentPage = getCurrentPage();
  history.replaceState({ page: currentPage }, '', window.location.pathname);
});