#!/bin/bash
# Instalador do Style Studio para Mac (macOS 12 Monterey ou mais novo, chip M ou Intel).
# Nao pede senha e nao usa Homebrew: o que faltar vai para a pasta do usuario, entao o proprio Claude consegue rodar.
#   ~/style-studio        o engine (clonado do GitHub) com o seu estilo instalado em skills/ e src/packs/
#   ~/.style-studio       programas base (Node 22, FFmpeg, Git, Python) e a transcricao (Whisper), so se faltarem
#   ~/style-studio-instalacao.log   o registro de tudo; termina com PRONTO!
# Como rodar (o Claude faz isso por voce):
#   bash instalar-mac.sh --diagnostico   so olha o computador e diz o que falta
#   bash instalar-mac.sh                 instala tudo que falta e faz um video de teste de 5 segundos
# Pode rodar de novo: ele pula o que ja esta pronto e continua de onde parou.

set -u
DESTINO="${STYLE_STUDIO_HOME:-$HOME/style-studio}"
TOOLS="${STYLE_STUDIO_TOOLS:-$HOME/.style-studio}"
LOG="${STYLE_STUDIO_LOG:-$HOME/style-studio-instalacao.log}"
REPO="${STYLE_STUDIO_REPO:-https://github.com/marcostuliodias/style-studio}"
ENV_DIR="$TOOLS/env"
VENV="$TOOLS/whisper"
MAMBA="$TOOLS/bin/micromamba"
PACOTE="$(cd "$(dirname "$0")" && pwd)"
DIAG=0
[ "${1:-}" = "--diagnostico" ] && DIAG=1

log() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*" | tee -a "$LOG"; }
passo() { log ""; log "== $* =="; }
erro() {
  log "ERRO: $*"
  log "Mande ao Claude: \"Deu este erro na instalacao: $*. Leia ~/style-studio-instalacao.log, corrija so o que deu errado e rode de novo.\""
  exit 1
}
tem() { [ -n "$1" ] && echo "ok" || echo "FALTA"; }
versao() { "$@" 2>/dev/null | head -1; }

# o que o sistema ja tem (serve se for novo o bastante), senao o que esta na nossa pasta
node_bin() { if [ -x "$ENV_DIR/bin/node" ]; then echo "$ENV_DIR/bin/node"; elif command -v node >/dev/null 2>&1 && [ "$(node -v | sed 's/v//' | cut -d. -f1)" -ge 22 ] 2>/dev/null; then command -v node; fi; }
ffmpeg_bin() { if [ -x "$ENV_DIR/bin/ffmpeg" ]; then echo "$ENV_DIR/bin/ffmpeg"; elif command -v ffmpeg >/dev/null 2>&1 && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then command -v ffmpeg; fi; }
git_bin() { if [ -x "$ENV_DIR/bin/git" ]; then echo "$ENV_DIR/bin/git"; elif command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1; then command -v git; fi; }
python_bin() { if [ -x "$ENV_DIR/bin/python3.12" ]; then echo "$ENV_DIR/bin/python3.12"; elif command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' 2>/dev/null; then command -v python3; fi; }

mkdir -p "$TOOLS" 2>/dev/null
: >> "$LOG"
[ "$DIAG" = 1 ] && log "---- diagnostico ----" || log "---- instalacao ----"

# ---------- diagnostico ----------
MACOS="$(sw_vers -productVersion 2>/dev/null)"
ARCH="$(uname -m)"
MAJOR="$(echo "$MACOS" | cut -d. -f1)"
LIVRE="$(df -g "$HOME" 2>/dev/null | awk 'NR==2{print $4}')"
NET="FALTA"; curl -sI --max-time 15 https://github.com >/dev/null 2>&1 && NET="ok"
N="$(node_bin)"; F="$(ffmpeg_bin)"; G="$(git_bin)"; P="$(python_bin)"
ENGINE="FALTA"; [ -f "$DESTINO/package.json" ] && ENGINE="ok"
DEPS="FALTA"; [ -d "$DESTINO/node_modules/remotion" ] && DEPS="ok"
CHROME="FALTA"; ls -d "$DESTINO/node_modules/.remotion"/chrome-headless-shell* >/dev/null 2>&1 && CHROME="ok"
WHISPER="FALTA"; [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c 'import faster_whisper' >/dev/null 2>&1 && WHISPER="ok"
ESTILOS="$(ls -d "$PACOTE"/skills/*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
INSTALADOS=""; for s in $ESTILOS; do [ -f "$DESTINO/skills/$s/SKILL.md" ] && INSTALADOS="$INSTALADOS $s"; done

log "macOS $MACOS ($ARCH)        $( [ "${MAJOR:-0}" -ge 12 ] && echo ok || echo 'FALTA: precisa de macOS 12 ou mais novo' )"
log "Espaco livre: ${LIVRE:-?} GB        $( [ "${LIVRE:-0}" -ge 5 ] && echo ok || echo 'FALTA: precisa de 5 GB' )"
log "Internet (github.com)       $NET"
log "Node 22+                    $(tem "$N") ${N:+($N)}"
log "FFmpeg com H.264            $(tem "$F") ${F:+($F)}"
log "Git                         $(tem "$G")"
log "Python 3.9+                 $(tem "$P")"
log "Engine em $DESTINO   $ENGINE"
log "Dependencias do engine      $DEPS"
log "Chrome de render (Remotion) $CHROME"
log "Transcricao (Whisper)       $WHISPER"
log "Estilos neste pacote:       ${ESTILOS:-nenhum}"
log "Estilos ja instalados:      ${INSTALADOS:- nenhum}"
[ "${MAJOR:-0}" -ge 12 ] || erro "este Mac tem macOS $MACOS; o Style Studio precisa do 12 (Monterey) ou mais novo"
[ "$NET" = "ok" ] || erro "sem internet para baixar os programas"
[ -n "$ESTILOS" ] || erro "nao achei a pasta skills/ ao lado deste instalador; extraia o zip inteiro"
if [ "$DIAG" = 1 ]; then
  log "Compativel. Falta instalar: $( [ -z "$N$F$G" ] && echo 'programas base, ' )$( [ "$ENGINE" = FALTA ] && echo 'engine, ' )$( [ "$WHISPER" = FALTA ] && echo 'Whisper, ' )o estilo."
  exit 0
fi

# ---------- 1. programas base ----------
passo "1/5 Programas base (Node 22, FFmpeg, Git, Python)"
if [ -n "$N" ] && [ -n "$F" ] && [ -n "$G" ] && [ -n "$P" ]; then
  log "  ja existem neste Mac, nada a instalar"
else
  if [ ! -x "$MAMBA" ]; then
    log "  baixando o micromamba (gerenciador de pacotes, fica em $TOOLS)"
    case "$ARCH" in arm64) PLAT="osx-arm64" ;; *) PLAT="osx-64" ;; esac
    mkdir -p "$TOOLS/bin"
    curl -Ls "https://micro.mamba.pm/api/micromamba/$PLAT/latest" | tar -xj -C "$TOOLS" bin/micromamba || erro "nao consegui baixar o micromamba"
  fi
  export MAMBA_ROOT_PREFIX="$TOOLS/mamba"
  log "  instalando nodejs 22, ffmpeg, git e python 3.12 do conda-forge (uns 5 minutos)"
  "$MAMBA" create -y -q -p "$ENV_DIR" -c conda-forge "nodejs=22" "ffmpeg=*=gpl*" git "python=3.12" >> "$LOG" 2>&1 || erro "a instalacao dos programas base falhou (veja o log)"
  N="$(node_bin)"; F="$(ffmpeg_bin)"; G="$(git_bin)"; P="$(python_bin)"
  [ -n "$N" ] && [ -n "$F" ] && [ -n "$G" ] || erro "os programas base nao apareceram em $ENV_DIR/bin"
  for perfil in "$HOME/.zprofile" "$HOME/.bash_profile"; do
    grep -qs "style-studio/env/bin" "$perfil" || printf '\n# Style Studio (node, ffmpeg, git)\nexport PATH="%s/bin:$PATH"\n' "$ENV_DIR" >> "$perfil"
  done
fi
export PATH="$(dirname "$N"):$(dirname "$F"):$(dirname "$G"):$PATH"
log "  ok: node $(versao node -v), $(versao ffmpeg -version | cut -d' ' -f1-3), $(versao git --version)"

# ---------- 2. engine ----------
passo "2/5 Engine (Style Studio) em $DESTINO"
if [ -d "$DESTINO/.git" ]; then
  log "  ja existe: atualizando"
  (cd "$DESTINO" && git pull -q --ff-only) >> "$LOG" 2>&1 || log "  (nao deu para atualizar; segue com a versao que esta ai)"
elif [ -f "$DESTINO/package.json" ]; then
  log "  ja existe (sem git): usando como esta"
else
  log "  clonando $REPO"
  git clone -q --depth 1 "$REPO" "$DESTINO" >> "$LOG" 2>&1 || erro "nao consegui clonar o engine"
fi
cd "$DESTINO" || erro "nao consegui entrar em $DESTINO"
if [ -d node_modules/remotion ] && [ node_modules/.package-lock.json -nt package-lock.json ]; then
  log "  dependencias ja instaladas"
else
  log "  npm ci (uns 2 minutos)"
  npm ci --no-audit --no-fund >> "$LOG" 2>&1 || erro "npm ci falhou"
fi
log "  Chrome de render do Remotion"
npx --yes remotion browser ensure >> "$LOG" 2>&1 || erro "nao consegui baixar o Chrome de render"
mkdir -p public/footage plans out

# ---------- 3. o estilo ----------
passo "3/5 O estilo deste pacote"
for s in $ESTILOS; do
  rm -rf "$DESTINO/skills/$s"
  cp -R "$PACOTE/skills/$s" "$DESTINO/skills/$s" || erro "nao consegui copiar skills/$s"
  [ -f "$PACOTE/src/packs/$s.json" ] && cp "$PACOTE/src/packs/$s.json" "$DESTINO/src/packs/$s.json"
  log "  ok: skills/$s e src/packs/$s.json"
done
PRIMEIRO="$(echo $ESTILOS | awk '{print $1}')"

# ---------- 4. whisper ----------
passo "4/5 Transcricao local (Whisper, com tempo por palavra)"
if [ "$WHISPER" = "ok" ]; then
  log "  ja instalado"
else
  [ -n "$P" ] || erro "sem Python 3.9+ para o Whisper"
  "$P" -m venv "$VENV" >> "$LOG" 2>&1 || erro "nao consegui criar o ambiente do Whisper"
  "$VENV/bin/python" -m pip install -q --disable-pip-version-check --upgrade pip >> "$LOG" 2>&1
  "$VENV/bin/python" -m pip install -q --disable-pip-version-check faster-whisper >> "$LOG" 2>&1 || erro "pip install faster-whisper falhou"
fi
log "  baixando o modelo 'small' (uns 500 MB, uma vez so)"
"$VENV/bin/python" -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')" >> "$LOG" 2>&1 || log "  (o modelo baixa na primeira transcricao)"
printf '%s\n' "$VENV/bin/python" > "$DESTINO/.whisper-python"
log "  ok: python scripts/transcrever.py <video.mp4> escreve o JSON com tempo por palavra"

# ---------- 5. teste ----------
passo "5/5 Video de teste (5 segundos, no estilo $PRIMEIRO)"
cat > plans/teste-instalacao.json <<EOF
{
  "pack": "$PRIMEIRO",
  "title": "Teste da instalacao",
  "shots": [
    { "scene": "quote", "frames": 150, "props": { "lines": ["O Style Studio", "esta instalado", "neste Mac."], "name": "Teste da instalacao", "role": "Pode editar o primeiro video" } }
  ]
}
EOF
node scripts/render-reel.mjs plans/teste-instalacao.json --out out/teste-instalacao.mp4 >> "$LOG" 2>&1 || erro "o render de teste falhou (veja o log)"
[ -s out/teste-instalacao.mp4 ] || erro "o video de teste nao apareceu"
log "  ok: $DESTINO/out/teste-instalacao.mp4"
[ "${STYLE_STUDIO_NO_OPEN:-0}" = 1 ] || open "$DESTINO/out" 2>/dev/null

log ""
log "PRONTO! O Style Studio esta instalado em $DESTINO com o estilo: $ESTILOS"
log "Proximo passo: feche o Claude por completo (Command+Q), abra de novo na aba Code, escolha a pasta $DESTINO"
log "e peca: \"Edite public/footage/<nome>/plate.mp4 em $PRIMEIRO\" (o Claude le o skill e faz o resto)."
