import type { IncomingMessage, ServerResponse } from 'node:http';
export const ROOT: string;
export const UPLOAD_DIR: string;
export const RENDER_DIR: string;
export const LIMITS: { maxRenders: number; maxQueue: number; renderTimeoutMs: number; maxUploadMb: number; maxFootageSeconds: number; uploads: boolean; exports: boolean; keepHours: number };
export const sweep: () => void;
export const api: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;
