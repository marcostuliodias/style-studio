# Style Studio (web)

A interface do Studio em cima do engine: um painel de escolhas que edita o pack JSON e uma prévia que renderiza as
cenas do board com o Remotion Player, no seu footage de demo.

```bash
npm run studio:web
```

Abre em <http://localhost:3490>. O build estático sai em `dist-studio/` com `npm run studio:build`.

## Como funciona

- `index.html` → `src/App.tsx`: o painel. Lê os seis packs direto dos JSON (`src/packs.ts`) e nunca importa
  `src/engine/style.ts`, que escolhe um pack para a página inteira assim que carrega.
- `src/recipes.ts`: cada controle do painel tem um `read(pack)` (o que o JSON diz hoje) e um `apply(pack, valor)`
  (o que a escolha muda). O painel sempre reflete o JSON, inclusive edições feitas à mão no editor avançado.
- `src/draft.ts`: o rascunho no `localStorage`, o histórico de desfazer/refazer e a revisão da prévia (debounce de
  250 ms).
- `preview.html` → `src/preview-main.ts`: a página do iframe. Entrega o pack ao engine em `window.__STYLE_PACK__`
  **antes** de importar o engine, e só então carrega `src/PreviewApp.tsx`, com três visões: as cenas como stills
  (`<Thumbnail>` no frame 60; `<Player>` quando "Tocar" está ligado), uma cena ampliada com a tira das outras, e o reel
  de exemplo (`<Player>` do `Reel` com a tira plano a plano, o plano atual acompanhando a reprodução). A cada mudança o
  Studio recarrega o iframe (`?rev=N`); `?compare=1` carrega o estilo de partida, para "Segurar para comparar";
  `?card=<id>` mostra a cena de título de um estilo pronto, para a galeria.
- `src/plan.ts`: o reel de exemplo. Até o servidor gerar o skill do rascunho (Fase 2), é o `example-plan.json` do
  estilo de partida ajustado ao rascunho: no footage de demo daqui, no pack atual, sem cena ou junção que o rascunho
  desligou. O plate de demo foi dobrado (clipe + reverso) para cobrir os 18 s do reel.
- Passar o mouse num controle contorna, na prévia, as cenas que ele muda (`affects` em `src/recipes.ts`). A interface
  veste a cor de destaque do rascunho.
- O footage e o rosto vêm de `public/footage/demo/plate.mp4` e `src/board/demo-shoot.json`, como no board.

## O servidor local (Fase 2)

`studio/api.mjs` é a API, usada pelo Vite em desenvolvimento (plugin em `vite.config.ts`) e por `studio/serve.mjs`
depois do build (`npm run studio:build` e `npm run studio:serve`). Tudo chama os scripts do próprio engine:

| Rota | O que faz |
|---|---|
| `POST /api/skill` `{ pack }` | `scripts/make-skill.mjs --pack --out` numa pasta temporária; devolve os arquivos do skill. O Studio chama a cada mudança (debounce de 300 ms) e monta o zip no navegador com JSZip: `skills/<id>/`, `src/packs/<id>.json` e `INSTALL-<id>.md`. |
| `POST /api/render` `{ pack, plan }` | `scripts/render-reel.mjs --pack --out out/studio/<id>/reel.mp4`; um job em memória com progresso lido das linhas de porcentagem. `GET /api/render?id=` acompanha; `/renders/<id>.mp4` serve o vídeo com Range. |
| `POST /api/footage` (corpo cru, `x-file-name`) | Converte com ffmpeg para `public/footage/<slug>/plate.mp4` (H.264, 30 fps) e devolve tamanho e duração. |
| `POST /api/tone` | `scripts/footage-tone.mjs` no frame escolhido: o tom da roupa sob o queixo. |

O footage próprio fica em `localStorage` (`style-studio:footage`): o shoot medido (rosto marcado com três cliques:
topo da cabeça, olhos e queixo) e o frame de partida. A prévia o recebe em `window.__STYLE_SHOOT__`, o reel de exemplo
usa o plano que o gerador escreveu para o rascunho, ajustado a esse footage.

## O que ainda falta

- Legenda do seu próprio áudio: é o fluxo do skill (Whisper com marcações por palavra, plano escrito pelo Claude Code,
  render pelo engine), fora do Studio.
- Publicar o Studio como demo (front na Vercel, servidor numa máquina com ffmpeg e Chrome).
