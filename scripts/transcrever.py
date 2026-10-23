"""Transcreve um vídeo com tempo por palavra, para o skill planejar as legendas.

Uso: python scripts/transcrever.py public/footage/<video>/plate.mp4 [--modelo small|medium] [--idioma pt]
Escreve <video>.json ao lado do arquivo, no formato do Whisper (segments[].words[] com word, start e end em
segundos), e imprime um resumo. Usa o faster-whisper do ambiente que o instalador criou (~/.style-studio/whisper);
rode com esse Python (o caminho fica em .whisper-python na raiz do engine) ou com qualquer Python que tenha
faster-whisper instalado.
"""
import json
import os
import sys

args = sys.argv[1:]
if not args or args[0].startswith("--"):
    print("uso: python scripts/transcrever.py <video.mp4> [--modelo small] [--idioma pt]")
    sys.exit(1)
video = args[0]
modelo = args[args.index("--modelo") + 1] if "--modelo" in args else "small"
idioma = args[args.index("--idioma") + 1] if "--idioma" in args else "pt"
if not os.path.exists(video):
    print(f"não achei {video}")
    sys.exit(1)

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("faster-whisper não está neste Python. Use o Python do instalador (veja .whisper-python) ou: pip install faster-whisper")
    sys.exit(1)

print(f"carregando o modelo {modelo}…")
model = WhisperModel(modelo, device="cpu", compute_type="int8")
segments, info = model.transcribe(video, language=idioma, word_timestamps=True, vad_filter=True)

out = {"text": "", "language": info.language, "duration": info.duration, "segments": []}
palavras = 0
for seg in segments:
    words = [{"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3), "probability": round(w.probability, 3)} for w in (seg.words or [])]
    palavras += len(words)
    out["segments"].append({"id": seg.id, "start": round(seg.start, 3), "end": round(seg.end, 3), "text": seg.text.strip(), "words": words})
    out["text"] += seg.text
out["text"] = out["text"].strip()

dest = os.path.splitext(video)[0] + ".json"
with open(dest, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f"{dest}: {len(out['segments'])} trechos, {palavras} palavras, {info.duration:.1f} s")
