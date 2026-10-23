# Instalador do Style Studio para Windows 10 ou 11.
# Nao pede senha de administrador: o que faltar vai para a pasta do usuario, entao o proprio Claude consegue rodar.
#   %USERPROFILE%\style-studio        o engine (clonado do GitHub) com o seu estilo em skills\ e src\packs\
#   %USERPROFILE%\.style-studio       programas base (Node 22, FFmpeg, Git, Python) e a transcricao (Whisper), so se faltarem
#   %USERPROFILE%\style-studio-instalacao.log   o registro de tudo; termina com PRONTO!
# Como rodar (o Claude faz isso por voce):
#   powershell -ExecutionPolicy Bypass -File instalar.ps1 -Diagnostico   so olha o computador e diz o que falta
#   powershell -ExecutionPolicy Bypass -File instalar.ps1                instala o que falta e faz um video de teste de 5 s
# Pode rodar de novo: ele pula o que ja esta pronto e continua de onde parou.
param([switch]$Diagnostico)

$ErrorActionPreference = 'Continue'
$Destino = if ($env:STYLE_STUDIO_HOME) { $env:STYLE_STUDIO_HOME } else { Join-Path $env:USERPROFILE 'style-studio' }
$Tools = if ($env:STYLE_STUDIO_TOOLS) { $env:STYLE_STUDIO_TOOLS } else { Join-Path $env:USERPROFILE '.style-studio' }
$Log = if ($env:STYLE_STUDIO_LOG) { $env:STYLE_STUDIO_LOG } else { Join-Path $env:USERPROFILE 'style-studio-instalacao.log' }
$Repo = if ($env:STYLE_STUDIO_REPO) { $env:STYLE_STUDIO_REPO } else { 'https://github.com/marcostuliodias/style-studio' }
$EnvDir = Join-Path $Tools 'env'
$Venv = Join-Path $Tools 'whisper'
$Mamba = Join-Path $Tools 'Library\bin\micromamba.exe'
$Pacote = Split-Path -Parent $MyInvocation.MyCommand.Path

New-Item -ItemType Directory -Force -Path $Tools | Out-Null
function Log($m) { $linha = "{0}  {1}" -f (Get-Date -Format 'HH:mm:ss'), $m; Write-Host $linha; Add-Content -Path $Log -Value $linha -Encoding UTF8 }
function Passo($m) { Log ''; Log "== $m ==" }
function Erro($m) {
  Log "ERRO: $m"
  Log "Mande ao Claude: `"Deu este erro na instalacao: $m. Leia o style-studio-instalacao.log na minha pasta de usuario, corrija so o que deu errado e rode de novo.`""
  exit 1
}
function Tem($v) { if ($v) { 'ok' } else { 'FALTA' } }
function Roda($exe, [string[]]$argumentos) {
  # roda um programa gravando a saida no log; devolve o codigo de saida
  $saida = & $exe @argumentos 2>&1
  $saida | ForEach-Object { Add-Content -Path $Log -Value ("    " + $_) -Encoding UTF8 }
  return $LASTEXITCODE
}

# o que o sistema ja tem (se for novo o bastante), senao o que esta na nossa pasta
function NodeBin {
  $p = Join-Path $EnvDir 'node.exe'; if (Test-Path $p) { return $p }
  $c = Get-Command node -ErrorAction SilentlyContinue
  if ($c) { $v = (& node -v) -replace 'v', ''; if ([int]($v.Split('.')[0]) -ge 22) { return $c.Source } }
  return $null
}
function FfmpegBin {
  $p = Join-Path $EnvDir 'Library\bin\ffmpeg.exe'; if (Test-Path $p) { return $p }
  $c = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($c) { $enc = & ffmpeg -hide_banner -encoders 2>$null; if ($enc -match 'libx264') { return $c.Source } }
  return $null
}
function GitBin {
  $p = Join-Path $EnvDir 'Library\bin\git.exe'; if (Test-Path $p) { return $p }
  $c = Get-Command git -ErrorAction SilentlyContinue; if ($c) { return $c.Source }
  return $null
}
function PythonBin {
  $p = Join-Path $EnvDir 'python.exe'; if (Test-Path $p) { return $p }
  foreach ($nome in @('python', 'python3')) {
    $c = Get-Command $nome -ErrorAction SilentlyContinue
    if ($c) { $ok = & $c.Source -c "import sys; print(1 if sys.version_info >= (3, 9) else 0)" 2>$null; if ("$ok" -eq '1') { return $c.Source } }
  }
  return $null
}

if ($Diagnostico) { Log '---- diagnostico ----' } else { Log '---- instalacao ----' }

# ---------- diagnostico ----------
$Win = [System.Environment]::OSVersion.Version
$Livre = [math]::Floor((Get-PSDrive -Name $env:USERPROFILE.Substring(0, 1)).Free / 1GB)
$Net = 'FALTA'; try { Invoke-WebRequest -Uri 'https://github.com' -Method Head -UseBasicParsing -TimeoutSec 15 | Out-Null; $Net = 'ok' } catch {}
$N = NodeBin; $F = FfmpegBin; $G = GitBin; $P = PythonBin
$Engine = if (Test-Path (Join-Path $Destino 'package.json')) { 'ok' } else { 'FALTA' }
$Deps = if (Test-Path (Join-Path $Destino 'node_modules\remotion')) { 'ok' } else { 'FALTA' }
$Chrome = if (Get-ChildItem -Path (Join-Path $Destino 'node_modules\.remotion') -Filter 'chrome-headless-shell*' -ErrorAction SilentlyContinue) { 'ok' } else { 'FALTA' }
$WhisperPy = Join-Path $Venv 'Scripts\python.exe'
$Whisper = 'FALTA'; if (Test-Path $WhisperPy) { & $WhisperPy -c 'import faster_whisper' 2>$null; if ($LASTEXITCODE -eq 0) { $Whisper = 'ok' } }
$Estilos = @(Get-ChildItem -Path (Join-Path $Pacote 'skills') -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
$Instalados = @($Estilos | Where-Object { Test-Path (Join-Path $Destino "skills\$_\SKILL.md") })

Log ("Windows {0}.{1} (build {2})     {3}" -f $Win.Major, $Win.Minor, $Win.Build, $(if ($Win.Major -ge 10) { 'ok' } else { 'FALTA: precisa do Windows 10 ou 11' }))
Log ("Espaco livre: {0} GB          {1}" -f $Livre, $(if ($Livre -ge 5) { 'ok' } else { 'FALTA: precisa de 5 GB' }))
Log "Internet (github.com)        $Net"
Log "Node 22+                     $(Tem $N) $N"
Log "FFmpeg com H.264             $(Tem $F) $F"
Log "Git                          $(Tem $G)"
Log "Python 3.9+                  $(Tem $P)"
Log "Engine em $Destino   $Engine"
Log "Dependencias do engine       $Deps"
Log "Chrome de render (Remotion)  $Chrome"
Log "Transcricao (Whisper)        $Whisper"
Log "Estilos neste pacote:        $($Estilos -join ' ')"
Log "Estilos ja instalados:       $(if ($Instalados) { $Instalados -join ' ' } else { 'nenhum' })"
if ($Win.Major -lt 10) { Erro 'precisa do Windows 10 ou 11' }
if ($Net -ne 'ok') { Erro 'sem internet para baixar os programas' }
if (-not $Estilos) { Erro 'nao achei a pasta skills\ ao lado deste instalador; extraia o zip inteiro' }
if ($Diagnostico) {
  $falta = @(); if (-not ($N -and $F -and $G -and $P)) { $falta += 'programas base' }; if ($Engine -eq 'FALTA') { $falta += 'engine' }; if ($Whisper -eq 'FALTA') { $falta += 'Whisper' }; $falta += 'o estilo'
  Log "Compativel. Falta instalar: $($falta -join ', ')."
  exit 0
}

# ---------- 1. programas base ----------
Passo '1/5 Programas base (Node 22, FFmpeg, Git, Python)'
if ($N -and $F -and $G -and $P) {
  Log '  ja existem neste computador, nada a instalar'
} else {
  if (-not (Test-Path $Mamba)) {
    Log "  baixando o micromamba (gerenciador de pacotes, fica em $Tools)"
    $tarball = Join-Path $Tools 'micromamba.tar.bz2'
    try { Invoke-WebRequest -Uri 'https://micro.mamba.pm/api/micromamba/win-64/latest' -OutFile $tarball -UseBasicParsing } catch { Erro 'nao consegui baixar o micromamba' }
    Push-Location $Tools; & tar -xf $tarball 2>&1 | Out-Null; Pop-Location
    Remove-Item $tarball -ErrorAction SilentlyContinue
    if (-not (Test-Path $Mamba)) { Erro 'o micromamba nao foi extraido (precisa do tar do Windows 10 1803+)' }
  }
  $env:MAMBA_ROOT_PREFIX = Join-Path $Tools 'mamba'
  Log '  instalando nodejs 22, ffmpeg, git e python 3.12 do conda-forge (uns 5 minutos)'
  $codigo = Roda $Mamba @('create', '-y', '-q', '-p', $EnvDir, '-c', 'conda-forge', 'nodejs=22', 'ffmpeg=*=gpl*', 'git', 'python=3.12')
  if ($codigo -ne 0) { Erro 'a instalacao dos programas base falhou (veja o log)' }
  $N = NodeBin; $F = FfmpegBin; $G = GitBin; $P = PythonBin
  if (-not ($N -and $F -and $G)) { Erro "os programas base nao apareceram em $EnvDir" }
  # no PATH do usuario, para o app do Claude achar node e ffmpeg depois
  $bins = @($EnvDir, (Join-Path $EnvDir 'Library\bin'), (Join-Path $EnvDir 'Scripts'))
  $atual = [Environment]::GetEnvironmentVariable('Path', 'User')
  foreach ($b in $bins) { if ($atual -notlike "*$b*") { $atual = "$b;$atual" } }
  [Environment]::SetEnvironmentVariable('Path', $atual, 'User')
}
$env:Path = (Split-Path $N) + ';' + (Split-Path $F) + ';' + (Split-Path $G) + ';' + $env:Path
Log ("  ok: node {0}, {1}, {2}" -f (& node -v), ((& ffmpeg -version 2>$null | Select-Object -First 1) -split ' ')[0..2] -join ' ', (& git --version))

# ---------- 2. engine ----------
Passo "2/5 Engine (Style Studio) em $Destino"
if (Test-Path (Join-Path $Destino '.git')) {
  Log '  ja existe: atualizando'
  Push-Location $Destino; $codigo = Roda 'git' @('pull', '-q', '--ff-only'); Pop-Location
  if ($codigo -ne 0) { Log '  (nao deu para atualizar; segue com a versao que esta ai)' }
} elseif (Test-Path (Join-Path $Destino 'package.json')) {
  Log '  ja existe (sem git): usando como esta'
} else {
  Log "  clonando $Repo"
  $codigo = Roda 'git' @('clone', '-q', '--depth', '1', $Repo, $Destino)
  if ($codigo -ne 0) { Erro 'nao consegui clonar o engine' }
}
Push-Location $Destino
$lock = Get-Item 'package-lock.json' -ErrorAction SilentlyContinue
$nmLock = Get-Item 'node_modules\.package-lock.json' -ErrorAction SilentlyContinue
if ((Test-Path 'node_modules\remotion') -and $nmLock -and $lock -and $nmLock.LastWriteTime -gt $lock.LastWriteTime) {
  Log '  dependencias ja instaladas'
} else {
  Log '  npm ci (uns 2 minutos)'
  $codigo = Roda 'npm.cmd' @('ci', '--no-audit', '--no-fund')
  if ($codigo -ne 0) { Erro 'npm ci falhou' }
}
Log '  Chrome de render do Remotion'
$codigo = Roda 'npx.cmd' @('--yes', 'remotion', 'browser', 'ensure')
if ($codigo -ne 0) { Erro 'nao consegui baixar o Chrome de render' }
foreach ($d in @('public\footage', 'plans', 'out')) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# ---------- 3. o estilo ----------
Passo '3/5 O estilo deste pacote'
foreach ($s in $Estilos) {
  $alvo = Join-Path $Destino "skills\$s"
  if (Test-Path $alvo) { Remove-Item -Recurse -Force $alvo }
  Copy-Item -Recurse -Path (Join-Path $Pacote "skills\$s") -Destination $alvo
  $pack = Join-Path $Pacote "src\packs\$s.json"
  if (Test-Path $pack) { Copy-Item -Path $pack -Destination (Join-Path $Destino "src\packs\$s.json") -Force }
  Log "  ok: skills\$s e src\packs\$s.json"
}
$Primeiro = $Estilos[0]

# ---------- 4. whisper ----------
Passo '4/5 Transcricao local (Whisper, com tempo por palavra)'
if ($Whisper -eq 'ok') {
  Log '  ja instalado'
} else {
  if (-not $P) { Erro 'sem Python 3.9+ para o Whisper' }
  $codigo = Roda $P @('-m', 'venv', $Venv)
  if ($codigo -ne 0) { Erro 'nao consegui criar o ambiente do Whisper' }
  Roda $WhisperPy @('-m', 'pip', 'install', '-q', '--disable-pip-version-check', '--upgrade', 'pip') | Out-Null
  $codigo = Roda $WhisperPy @('-m', 'pip', 'install', '-q', '--disable-pip-version-check', 'faster-whisper')
  if ($codigo -ne 0) { Erro 'pip install faster-whisper falhou' }
}
Log "  baixando o modelo 'small' (uns 500 MB, uma vez so)"
$codigo = Roda $WhisperPy @('-c', "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')")
if ($codigo -ne 0) { Log '  (o modelo baixa na primeira transcricao)' }
Set-Content -Path (Join-Path $Destino '.whisper-python') -Value $WhisperPy -Encoding UTF8
Log '  ok: python scripts\transcrever.py <video.mp4> escreve o JSON com tempo por palavra'

# ---------- 5. teste ----------
Passo "5/5 Video de teste (5 segundos, no estilo $Primeiro)"
$plano = @{
  pack = $Primeiro
  title = 'Teste da instalacao'
  shots = @(@{ scene = 'quote'; frames = 150; props = @{ lines = @('O Style Studio', 'esta instalado', 'neste computador.'); name = 'Teste da instalacao'; role = 'Pode editar o primeiro video' } })
} | ConvertTo-Json -Depth 6
Set-Content -Path 'plans\teste-instalacao.json' -Value $plano -Encoding UTF8
$codigo = Roda 'node' @('scripts/render-reel.mjs', 'plans/teste-instalacao.json', '--out', 'out/teste-instalacao.mp4')
if ($codigo -ne 0 -or -not (Test-Path 'out\teste-instalacao.mp4')) { Erro 'o render de teste falhou (veja o log)' }
Log "  ok: $Destino\out\teste-instalacao.mp4"
if ($env:STYLE_STUDIO_NO_OPEN -ne '1') { Start-Process explorer.exe (Join-Path $Destino 'out') }
Pop-Location

Log ''
Log "PRONTO! O Style Studio esta instalado em $Destino com o estilo: $($Estilos -join ' ')"
Log "Proximo passo: feche o Claude por completo (icone perto do relogio > Sair), abra de novo na aba Code, escolha a pasta $Destino"
Log "e peca: `"Edite public/footage/<nome>/plate.mp4 em $Primeiro`" (o Claude le o skill e faz o resto)."
