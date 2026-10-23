# Colocar o Style Studio online

O Studio precisa de um servidor de verdade: o render roda ffmpeg e um Chrome headless. Vercel, Netlify e afins não
servem para isso. O caminho é uma imagem Docker (o `Dockerfile` na raiz) numa máquina com pelo menos **2 CPUs e
4 GB**. Um reel de 20 s leva menos de um minuto num Mac; numa VPS pequena, de dois a três.

## Antes de tudo: o vídeo de demo

O vídeo de demo não vai no git. Antes de construir a imagem, deixe na pasta:

- `public/footage/demo/plate.mp4`: um talking-head cortado, H.264 a 30 fps (o Studio converte qualquer upload para
  isso; para o demo, `ffmpeg -i seu.mov -r 30 -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac public/footage/demo/plate.mp4`).
- `src/board/demo-shoot.json`: o rosto medido nesse vídeo (centro, topo da cabeça, olhos, queixo, tom). O jeito
  mais fácil de medir é no próprio Studio local, em "Usar meu footage", e copiar os números.

Esse vídeo aparece para todo mundo que abrir o site, então use um seu ou um de banco com licença.

## Limites (variáveis de ambiente)

| Variável | Padrão | O que faz |
|---|---|---|
| `STUDIO_MAX_RENDERS` | 1 | renders ao mesmo tempo; os outros esperam na fila |
| `STUDIO_MAX_QUEUE` | 6 | quantos podem esperar; acima disso o Studio responde 429 |
| `STUDIO_RENDER_TIMEOUT_MS` | 600000 | um render é interrompido depois disso (10 min) |
| `STUDIO_MAX_UPLOAD_MB` | 400 | tamanho máximo de um upload |
| `STUDIO_MAX_FOOTAGE_SECONDS` | 600 | duração máxima de um clipe enviado |
| `STUDIO_UPLOADS` | 1 | `0` desliga o upload (o site mostra só o demo) |
| `STUDIO_EXPORTS` | 1 | `0` desliga a exportação de vídeo (o site só mostra a prévia e entrega o skill) |
| `STUDIO_KEEP_HOURS` | 6 | uploads e renders mais velhos que isso são apagados |

Com `STUDIO_UPLOADS=0` o botão "Usar meu footage" some da interface; com `STUDIO_EXPORTS=0` some o "Exportar vídeo".
Os dois desligados é a demo mais barata e segura: o servidor só serve a prévia e escreve o skill (segundos de CPU),
e o render de verdade acontece na máquina de quem baixou o skill. O `docker-compose.yml` já vem sem upload.

## Opção A: Fly.io (HTTPS e domínio prontos)

```bash
brew install flyctl
```

```bash
fly auth login
```

Na pasta do projeto (o `fly.toml` já está pronto; troque o `app` por um nome livre):

```bash
fly launch --no-deploy --copy-config
```

```bash
fly volumes create uploads --size 10 --region gru
```

```bash
fly deploy
```

O build roda na nuvem do Fly a partir do seu checkout (ele envia a pasta local, então o `plate.mp4` de demo vai
junto). Para um domínio próprio: `fly certs add studio.seudominio.com` e aponte um CNAME para `<app>.fly.dev`.
A máquina configurada é `shared-cpu-2x` com 4 GB; ela desliga sozinha sem tráfego e religa no primeiro acesso.

## Opção B: uma VPS (Hetzner, DigitalOcean) com Docker Compose

Numa máquina Ubuntu com Docker instalado e o DNS do domínio apontando para ela:

```bash
git clone https://github.com/marcostuliodias/style-studio && cd style-studio
```

Coloque o vídeo de demo como acima, depois:

```bash
DOMAIN=studio.seudominio.com docker compose up -d --build
```

O Caddy (em `deploy/Caddyfile`) pega o certificado HTTPS sozinho e repassa para o Studio. Os uploads e os renders
ficam em volumes nomeados e são varridos pela API depois de `STUDIO_KEEP_HOURS`.

Para atualizar: `git pull && docker compose up -d --build`.

## Opção C: uma VPS que já tem nginx nas portas 80 e 443

Sem o Caddy: só o app, preso ao localhost, e o nginx do host na frente.

```bash
docker compose -f deploy/docker-compose.behind-proxy.yml up -d --build
```

```bash
sudo cp deploy/nginx-studio.conf /etc/nginx/sites-available/studio && sudo ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/studio && sudo nginx -t && sudo systemctl reload nginx
```

```bash
sudo certbot --nginx -d studio.marcostulio.com
```

Troque o `server_name` no arquivo pelo seu domínio. Esse Compose vem sem upload e sem exportação de vídeo.

## Testar a imagem localmente

```bash
docker build -t style-studio . && docker run --rm -p 3490:3490 style-studio
```

Depois abra <http://localhost:3490>. `GET /api/health` mostra os limites em vigor e o estado da fila.

## O que o servidor faz, resumido

`studio/serve.mjs` serve o build estático (`dist-studio/`), a pasta `public/` (fontes e footage, com Range para o
vídeo avançar) e a API de `studio/api.mjs`: gerar o skill, enfileirar e acompanhar renders, receber footage, medir o
tom. Tudo chama os scripts do engine (`scripts/*.mjs`). Nada precisa de banco de dados; o estado da fila vive na
memória do processo, e um restart só perde renders em andamento.
