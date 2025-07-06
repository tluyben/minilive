declare global {
  interface Window {
    /**
     * Trigger an event that will be sent to the server
     * @param eventType - The type of event to trigger
     * @param payload - Optional payload data to send with the event
     */
    triggerEvent(eventType: string, payload?: Record<string, any>): void;
    
    /** The session ID for the current client */
    _sessionId: string;
    
    /** Internal: Socket.IO instance */
    _socket: any;
    
    /** Internal: Event queue for events triggered before socket is ready */
    _eventQueue: Array<{ eventType: string; payload: Record<string, any> }>;
  }
}

export {};