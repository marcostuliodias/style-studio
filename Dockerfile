# The Style Studio online: the engine, its web Studio and the local API in one image, with ffmpeg and the headless
# Chrome that Remotion renders with. Build it from the engine's root (the folder with package.json):
#   docker build -t style-studio .
#   docker run -p 3490:3490 -e STUDIO_HOST=0.0.0.0 style-studio
# The demo footage (public/footage/demo/plate.mp4, measured in src/board/demo-shoot.json) is copied into the image
# when it's on disk at build time; without it the Studio runs, but the scenes show no presenter.
FROM node:22-bookworm-slim

# ffmpeg for the footage, and what Remotion's chrome-headless-shell needs to run (remotion.dev/docs/docker)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgbm1 \
    libasound2 \
    libxrandr2 \
    libxkbcommon0 \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libxshmfence1 \
    libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    STUDIO_HOST=0.0.0.0 \
    PORT=3490

# dependencies first, so a code change doesn't reinstall them (devDependencies too: the Studio is built here)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --include=dev

COPY . .

# the browser Remotion renders with, downloaded now rather than on the first export, and the Studio's static build
RUN npx remotion browser ensure && npm run studio:build

RUN mkdir -p public/footage/uploads out/studio
VOLUME ["/app/public/footage/uploads", "/app/out/studio"]
EXPOSE 3490

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3490/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "studio/serve.mjs"]
