import type { StylePack } from '../../src/engine/pack';
import type { Shoot } from '../../src/kit/Presenter';
import type { ReelPlan } from '../../src/reel/plan';

// The Studio's local API (studio/api.mjs), from the browser.

export type SkillFiles = Record<string, string>;
export type RenderJob = { status: 'queued' | 'rendering' | 'done' | 'error'; position?: number; progress: number; log: string[]; url: string | null; error: string | null };
export type ServerInfo = { ok: boolean; uploads: boolean; exports: boolean; maxUploadMb: number; maxFootageSeconds: number; keepHours: number; queue: { active: number; waiting: number; max: number; maxWaiting: number } };

/** What this server allows; null when it isn't answering (the API isn't running). */
export const serverInfo = async (): Promise<ServerInfo | null> => {
  try {
    const r = await fetch('/api/health');
    return r.ok ? ((await r.json()) as ServerInfo) : null;
  } catch {
    return null;
  }
};
export type Footage = { shoot: Shoot; at: number; name: string; duration: number };

const post = async <T,>(url: string, body: unknown, signal?: AbortSignal): Promise<T> => {
  let r: Response;
  try {
    r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Error('O Studio não está respondendo. Ele ainda está rodando?');
  }
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? `O Studio respondeu ${r.status}`);
  return j;
};

/** The skill the engine writes for a pack: its files by path, and the generator's notes. */
export const makeSkill = (pack: StylePack, signal?: AbortSignal) => post<{ files: SkillFiles; notes: string[] }>('/api/skill', { pack }, signal);

export const startRender = (pack: StylePack, plan: ReelPlan) => post<{ id: string }>('/api/render', { pack, plan });

export const pollRender = async (id: string): Promise<RenderJob> => {
  const r = await fetch(`/api/render?id=${encodeURIComponent(id)}`);
  const j = (await r.json().catch(() => ({}))) as RenderJob & { error?: string };
  if (r.status === 404) throw new Error('O Studio reiniciou e perdeu esse render. Exporte de novo.');
  if (!r.ok) throw new Error(j.error ?? `O Studio respondeu ${r.status}`);
  return j;
};

export const measureTone = (plate: string, faceX: number, eyes: number, chin: number, at: number) => post<{ chest: number }>('/api/tone', { plate, faceX, eyes, chin, at });

/** Upload a video to the engine's footage folder; it comes back converted, with its size and length. */
export const uploadFootage = (file: File, onProgress: (p: number) => void) =>
  new Promise<{ plate: string; name: string; width: number; height: number; duration: number }>((resolve, reject) => {
    const q = new XMLHttpRequest();
    q.open('POST', '/api/footage');
    q.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    q.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    q.onload = () => {
      try {
        const j = JSON.parse(q.responseText);
        if (q.status >= 400) reject(new Error(j.error ?? `O upload falhou (${q.status})`));
        else resolve(j);
      } catch {
        reject(new Error(`O upload falhou (${q.status})`));
      }
    };
    q.onerror = () => reject(new Error('O upload parou: o Studio ainda está rodando?'));
    q.send(file);
  });

/** The zip a creator unzips in the engine's folder: the skill, the pack, and the steps by hand. */
export const skillZip = async (pack: StylePack, files: SkillFiles) => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const [name, text] of Object.entries(files)) zip.file(`skills/${pack.id}/${name}`, text);
  zip.file(`src/packs/${pack.id}.json`, `${JSON.stringify(pack, null, 2)}\n`);
  zip.file(`INSTALL-${pack.id}.md`, installMd(pack));
  return zip.generateAsync({ type: 'blob' });
};

export const installMd = (pack: StylePack) => `# Instalar o estilo ${pack.name}

Este zip tem o skill de edição do ${pack.name} para o Claude Code e o pack do estilo. Ele roda no style-studio.

1. Se ainda não tem o engine: \`git clone https://github.com/marcostuliodias/style-studio\` e, dentro da pasta, \`npm install\`.
   Precisa de Node 22 ou mais novo, ffmpeg e ffprobe no PATH.
2. Descompacte este zip dentro da pasta \`style-studio\` (a que tem o \`package.json\`). Ele adiciona
   \`skills/${pack.id}/\` e \`src/packs/${pack.id}.json\`; o engine acha o estilo por esse id.
3. Coloque o vídeo cortado em \`public/footage/<nome>/plate.mp4\`, com as marcações de tempo por palavra ao lado
   (um JSON do Whisper: \`whisper plate.mp4 --model small --word_timestamps True --output_format json\`).
4. Abra o Claude Code nessa pasta e peça: "Edite public/footage/<nome>/plate.mp4 em ${pack.name}. As marcações estão
   em plate.json ao lado."

O Claude lê \`skills/${pack.id}/SKILL.md\`, monta o plano, checa, renderiza stills para revisar e depois o vídeo em
\`out/reels/<nome>.mp4\`.
`;

/** The prompt to paste into Claude Code, which fetches the engine and installs the skill. */
export const claudePrompt = (pack: StylePack) => `Me prepara para editar meus vídeos em "${pack.name}", um estilo de edição que fiz no Style Studio.

1. Pegue o engine: se já existe uma pasta style-studio aqui, use ela (git pull antes); se não, clone https://github.com/marcostuliodias/style-studio e rode npm install nela. Precisa de Node 22 ou mais novo, ffmpeg e ffprobe; me avise se faltar algum.
2. Descompacte meu zip ${pack.id}-skill mais recente (provavelmente na pasta Downloads; um download repetido vem como "${pack.id}-skill (1).zip") dentro da pasta style-studio, para que ele adicione skills/${pack.id}/ e src/packs/${pack.id}.json.
3. Daqui em diante trabalhe em style-studio: leia o CLAUDE.md e o skills/${pack.id}/SKILL.md e siga os dois. Depois me peça o vídeo cortado que eu quero editar e as marcações de tempo por palavra (ou se ofereça para fazer as marcações).`;
