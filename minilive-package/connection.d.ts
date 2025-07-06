import { Socket } from 'socket.io';

export interface Connection {
  socket: Socket | null;
  currentPage: string | null;
  pageStates: Record<string, any>;
  lastInputs: Record<string, any>;
  createdAt: number;
  lastActivity: number;
  lastDisconnect?: number;
}

export interface ConnectionStats {
  totalSessions: number;
  connected: number;
  disconnected: number;
  pageCount: Record<string, number>;
}

export declare class ConnectionManager {
  connections: Map<string, Connection>;
  socketToSession: Map<string, string>;

  generateSessionId(): string;
  registerConnection(socket: Socket, sessionId: string, currentPage?: string | null): void;
  updateCurrentPage(sessionId: string, page: string): void;
  getConnection(sessionId: string): Connection | undefined;
  getConnectionBySocket(socketId: string): Connection | null;
  getConnectionsOnPage(page: string): Array<{ sessionId: string; connection: Connection }>;
  handleDisconnect(socketId: string): void;
  cleanupStaleSessions(maxInactiveTime?: number): number;
  getPageStates(sessionId: string): Record<string, any>;
  updatePageState(sessionId: string, page: string, state: any): void;
  clearPageState(sessionId: string, page: string): void;
  updateLastInput(sessionId: string, page: string, input: any): void;
  getLastInput(sessionId: string, page: string): any | null;
  broadcastToPage(page: string, event: string, data: any): void;
  sendToSession(sessionId: string, event: string, data: any): boolean;
  getStats(): ConnectionStats;
}

declare const connectionManager: ConnectionManager;
export default connectionManager;