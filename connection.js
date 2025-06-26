// connection.js - Session and connection management
const crypto = require('crypto');

class ConnectionManager {
  constructor() {
    // Map of sessionId -> { socket, currentPage, pageStates }
    this.connections = new Map();
    
    // Map of socketId -> sessionId (for quick lookup during disconnect)
    this.socketToSession = new Map();
  }

  // Generate a new session ID
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Register a new connection or update existing one
  registerConnection(socket, sessionId, currentPage = null) {
    const socketId = socket.id;
    
    // If this session already exists, update it
    if (this.connections.has(sessionId)) {
      const connection = this.connections.get(sessionId);
      
      // Clean up old socket if it exists and is different
      if (connection.socket && connection.socket.id !== socketId) {
        this.socketToSession.delete(connection.socket.id);
      }
      
      // Update with new socket
      connection.socket = socket;
      if (currentPage) {
        connection.currentPage = currentPage;
      }
      
      console.log(`Updated connection for session ${sessionId}, page: ${connection.currentPage}`);
    } else {
      // Create new connection entry
      this.connections.set(sessionId, {
        socket: socket,
        currentPage: currentPage,
        pageStates: {},
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
      
      console.log(`New connection for session ${sessionId}, page: ${currentPage}`);
    }
    
    // Update socket-to-session mapping
    this.socketToSession.set(socketId, sessionId);
  }

  // Update the current page for a session
  updateCurrentPage(sessionId, page) {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.currentPage = page;
      connection.lastActivity = Date.now();
      console.log(`Session ${sessionId} navigated to ${page}`);
    }
  }

  // Get connection by session ID
  getConnection(sessionId) {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
    return connection;
  }

  // Get connection by socket ID
  getConnectionBySocket(socketId) {
    const sessionId = this.socketToSession.get(socketId);
    return sessionId ? this.getConnection(sessionId) : null;
  }

  // Get all connections on a specific page
  getConnectionsOnPage(page) {
    const connections = [];
    for (const [sessionId, connection] of this.connections) {
      if (connection.currentPage === page && connection.socket && connection.socket.connected) {
        connections.push({ sessionId, connection });
      }
    }
    return connections;
  }

  // Remove a connection when socket disconnects
  handleDisconnect(socketId) {
    const sessionId = this.socketToSession.get(socketId);
    if (sessionId) {
      const connection = this.connections.get(sessionId);
      if (connection && connection.socket && connection.socket.id === socketId) {
        console.log(`Socket ${socketId} disconnected for session ${sessionId}`);
        // Don't delete the connection entirely - just mark socket as null
        // This allows reconnection with the same session ID
        connection.socket = null;
        connection.lastDisconnect = Date.now();
      }
      this.socketToSession.delete(socketId);
    }
  }

  // Clean up stale sessions (optional, can be called periodically)
  cleanupStaleSessions(maxInactiveTime = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = Date.now();
    const stale = [];
    
    for (const [sessionId, connection] of this.connections) {
      const lastActive = connection.lastActivity || connection.createdAt;
      const isStale = !connection.socket && (now - lastActive > maxInactiveTime);
      
      if (isStale) {
        stale.push(sessionId);
      }
    }
    
    for (const sessionId of stale) {
      console.log(`Cleaning up stale session ${sessionId}`);
      this.connections.delete(sessionId);
    }
    
    return stale.length;
  }

  // Get page states for a session
  getPageStates(sessionId) {
    const connection = this.connections.get(sessionId);
    return connection ? connection.pageStates : {};
  }

  // Update page state for a session
  updatePageState(sessionId, page, state) {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.pageStates[page] = state;
      connection.lastActivity = Date.now();
    }
  }

  // Clear page state for a session
  clearPageState(sessionId, page) {
    const connection = this.connections.get(sessionId);
    if (connection && connection.pageStates[page]) {
      delete connection.pageStates[page];
    }
  }

  // Broadcast to all connections on a specific page
  broadcastToPage(page, event, data) {
    const connections = this.getConnectionsOnPage(page);
    for (const { connection } of connections) {
      if (connection.socket && connection.socket.connected) {
        connection.socket.emit(event, data);
      }
    }
  }

  // Send to a specific session
  sendToSession(sessionId, event, data) {
    const connection = this.connections.get(sessionId);
    if (connection && connection.socket && connection.socket.connected) {
      connection.socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Get statistics
  getStats() {
    let connected = 0;
    let disconnected = 0;
    const pageCount = {};
    
    for (const connection of this.connections.values()) {
      if (connection.socket && connection.socket.connected) {
        connected++;
        if (connection.currentPage) {
          pageCount[connection.currentPage] = (pageCount[connection.currentPage] || 0) + 1;
        }
      } else {
        disconnected++;
      }
    }
    
    return {
      totalSessions: this.connections.size,
      connected,
      disconnected,
      pageCount
    };
  }
}

// Export a singleton instance
module.exports = new ConnectionManager();