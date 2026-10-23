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

/** The zip a creator unzips anywhere: the installers, the skill, the pack and the steps. */
export const skillZip = async (pack: StylePack, files: SkillFiles) => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const [name, text] of Object.entries(files)) zip.file(`skills/${pack.id}/${name}`, text);
  zip.file(`src/packs/${pack.id}.json`, `${JSON.stringify(pack, null, 2)}\n`);
  zip.file('LEIA-PRIMEIRO.md', leiaPrimeiro(pack));
  // the installers the Claude runs (served with the Studio, in public/installer)
  for (const [name, exec] of [['instalar-mac.sh', true], ['INSTALAR-MAC.command', true], ['instalar.ps1', false], ['INSTALAR.bat', false]] as const) {
    const r = await fetch(`/installer/${name}`);
    if (r.ok) zip.file(name, await r.text(), exec ? { unixPermissions: '755' } : {});
  }
  return zip.generateAsync({ type: 'blob', platform: 'UNIX' });
};

/** The message to paste into Claude Code: diagnose, install, follow the log, check the test video. */
export const claudePrompt = (pack: StylePack) => `Instala para mim o estilo "${pack.name}" do Style Studio que está nesta pasta (${pack.id}-skill.zip).
1. Extraia o zip e faça primeiro o diagnóstico: rode o instalador do meu sistema só no modo diagnóstico (Mac: bash instalar-mac.sh --diagnostico · Windows: powershell -ExecutionPolicy Bypass -File instalar.ps1 -Diagnostico) e me diga se o meu computador é compatível, o que já está pronto e o que falta.
2. Se for compatível, rode o instalador completo em segundo plano (Mac: bash instalar-mac.sh · Windows: powershell -ExecutionPolicy Bypass -File instalar.ps1) e acompanhe o arquivo style-studio-instalacao.log da minha pasta de usuário até aparecer PRONTO!. Me explique cada etapa em palavras simples.
3. Se der erro, leia esse registro, corrija só o que deu errado e rode de novo (ele continua de onde parou e não apaga nada meu).
4. No final o instalador cria um vídeo de teste de 5 segundos em style-studio/out e abre a pasta. Confirme que o vídeo existe e me diga o que fazer depois.`;

export const leiaPrimeiro = (pack: StylePack) => `# ${pack.name}: comece aqui (Mac e Windows)

Este zip tem o seu estilo e o instalador. Quem instala tudo é o próprio Claude: você só cola uma mensagem.

## Antes de tudo
- Windows 10 ou 11, ou Mac com macOS 12 (Monterey) ou mais novo (chip M ou Intel).
- Uns 5 GB livres e internet boa.
- Assinatura do Claude Pro ou Max, e o app do Claude instalado (claude.ai/download), entrando com a conta do plano.

## Instalar (uma vez só, 10 a 30 minutos): o Claude instala
1. Deixe este zip (\`${pack.id}-skill.zip\`) na pasta Downloads. Não precisa extrair.
2. Abra o app do Claude → aba Code → escolha a pasta Downloads.
3. Cole e envie esta mensagem:

> ${claudePrompt(pack).split('\n').join('\n> ')}

4. Clique em Permitir sempre que o Claude pedir. No Windows, clique em Sim se o sistema perguntar se pode fazer alterações. Deixe o computador na tomada.
5. Quando terminar, o vídeo teste-instalacao.mp4 abre numa pasta. Se ele tocar, está tudo instalado.

O instalador não pede senha nem usa Homebrew: o que faltar (Node, FFmpeg, Git, Python) vai para a pasta .style-studio da sua pasta de usuário; o engine vai para style-studio, com o seu estilo em skills/${pack.id}/.

**Deu erro e o Claude não resolveu?** Envie: "Deu este erro na instalação: [cole aqui]. Leia o style-studio-instalacao.log na minha pasta de usuário, explique a causa em palavras simples, corrija só o que está relacionado e continue de onde parou. Não apague os meus arquivos."

**Fechou o Claude no meio?** Abra de novo na pasta Downloads e envie: "Eu fechei o Claude no meio da instalação do Style Studio. Rode o instalador de novo: ele pula o que já está pronto. No final confira o vídeo de teste."

### Prefere instalar sem o Claude?
Extraia o zip e dê dois cliques em INSTALAR-MAC.command (Mac) ou INSTALAR.bat (Windows).

## Depois de instalar: o primeiro vídeo
1. Feche o Claude por completo (Mac: Command+Q · Windows: ícone perto do relógio › Sair) e abra de novo.
2. Na aba Code, escolha a pasta style-studio (fica na sua pasta de usuário).
3. Coloque o vídeo cortado em public/footage/<nome>/plate.mp4 e peça: "Edite public/footage/<nome>/plate.mp4 em ${pack.name}. Se não houver marcações de tempo por palavra, faça com scripts/transcrever.py."
4. O Claude lê skills/${pack.id}/SKILL.md, monta o plano, checa e abre o storyboard no seu navegador: você assiste o corte, escolhe entre as opções, marca erros de fala e diz o que mudar (só neste vídeo, ou sempre). O que você marca "sempre" vira regra para os próximos vídeos.
5. Depois que você aprova, ele renderiza em out/reels/<nome>.mp4.

Quer outro estilo? Crie no Style Studio, baixe o zip novo e repita a mensagem de instalação: ele só adiciona o estilo.
`;
