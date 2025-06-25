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
  socket.on('update', ({ html }) => {
    console.log('Update received, applying intelligent patch...');
    
    // Create a temporary body element with the new content
    const newBody = document.createElement('body');
    newBody.innerHTML = html;
    
    // Use morphdom to intelligently update the body
    // This preserves event listeners, form input state, focus, etc.
    morphdom(document.body, newBody, {
      onBeforeElUpdated: function(fromEl, toEl) {
        // Preserve input values
        if (fromEl.tagName === 'INPUT' && fromEl.type !== 'password') {
          toEl.value = fromEl.value;
        }
        // Preserve focus
        if (fromEl === document.activeElement && fromEl.tagName === 'INPUT') {
          setTimeout(() => toEl.focus(), 0);
        }
        return true;
      }
    });
  });

  // Listen for commands from server
  socket.on('command', (data) => {
    console.log('Command received:', data);
    switch (data.command) {
      case 'redirect':
        window.location.href = data.location;
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
    
    // Process any queued events
    while (window._eventQueue.length > 0) {
      const { eventType, payload } = window._eventQueue.shift();
      window.triggerEvent(eventType, payload);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
});