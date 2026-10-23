#!/bin/bash
# Dois cliques no Finder abrem o Terminal e rodam o instalador do Style Studio (sem precisar do Claude).
cd "$(dirname "$0")" && bash ./instalar-mac.sh
echo; echo "Pode fechar esta janela."
