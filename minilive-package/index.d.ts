import { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface MiniLiveOptions {
  /** Port to run the server on. Defaults to process.env.PORT || 3000 */
  port?: number;
  /** Directory containing page templates (.mhtml files). Defaults to './pages' */
  pagesDir?: string;
  /** Directory containing page logic scripts (.js files). Defaults to './logic' */
  logicDir?: string;
  /** Directory for static files. Defaults to './public' */
  publicDir?: string;
  /** Custom command handler function */
  commandHandler?: (cmd: Command, context: CommandContext) => boolean | Promise<boolean>;
  /** Function to rewrite templates before rendering */
  templateRewriter?: (template: string, context: TemplateContext) => string;
  /** Function to include custom scripts/styles per page */
  includes?: (page: string) => Include[] | null;
}

export interface Command {
  type?: string;
  command?: string;
  location?: string;
  [key: string]: any;
}

export interface CommandContext {
  socket: Socket | null;
  res: Response | null;
}

export interface TemplateContext {
  page: string;
  data: Record<string, any>;
  sessionId: string | null;
}

export type Include = string | {
  type: 'css' | 'js' | 'inline-css' | 'inline-js';
  src?: string;
  content?: string;
  defer?: boolean;
  async?: boolean;
};

export interface LogicInput {
  request: {
    method: string;
    headers: Record<string, string>;
    query: Record<string, any>;
    params: Record<string, any>;
    url: string;
  };
  event: string;
  payload?: Record<string, any>;
  [key: string]: any;
}

export interface LogicOutput {
  commands?: Command[];
  [key: string]: any;
}

export interface HeadData {
  title?: string;
  meta?: Record<string, string>;
  styles?: string[];
}

export declare class MiniLive {
  options: MiniLiveOptions;
  app: Express;
  server: HttpServer;
  io: SocketIOServer;

  constructor(options?: MiniLiveOptions);

  setupMiddleware(): void;
  setupRoutes(): void;
  setupWebSocket(): void;
  
  executeLogic(page: string, input: LogicInput): LogicOutput;
  processCommands(commands: Command[], socket?: Socket | null, res?: Response | null): Promise<void>;
  renderTemplate(page: string, data: Record<string, any>, injectScripts?: boolean, sessionId?: string | null): string;
  extractHeadData(html: string): HeadData;
  
  serve(callback?: () => void): HttpServer;
}

declare function createMiniLive(options?: MiniLiveOptions): MiniLive;

export default createMiniLive;
export { createMiniLive, MiniLive };