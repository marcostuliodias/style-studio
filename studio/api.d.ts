import type { IncomingMessage, ServerResponse } from 'node:http';
export const ROOT: string;
export const api: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
