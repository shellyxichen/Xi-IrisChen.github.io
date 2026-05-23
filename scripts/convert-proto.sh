#!/usr/bin/env bash
# Convert assets/2026/proto/* to compressed H.264 MP4 for web (Chrome + faststart).
# Run from repo root:  bash scripts/convert-proto.sh
# Requires: brew install ffmpeg

set -euo pipefail

PROTO_DIR="$(cd "$(dirname "$0")/../assets/2026/proto" && pwd)"
OUT_DIR="${PROTO_DIR}/mp4"
mkdir -p "$OUT_DIR"

cd "$PROTO_DIR"

convert_mov() {
  local infile="$1"
  local outfile="$2"
  local crf="${3:-26}"
  local max_w="${4:-1920}"
  echo "→ ${outfile} (crf=${crf}, max width=${max_w})"
  ffmpeg -y -hide_banner -loglevel warning -i "$infile" \
    -c:v libx264 -crf "$crf" -preset slow \
    -vf "scale='min(${max_w},iw)':-2" \
    -an \
    -movflags +faststart \
    "${OUT_DIR}/${outfile}"
}

recompress_mp4() {
  local infile="$1"
  local outfile="$2"
  local crf="${3:-26}"
  local max_w="${4:-1920}"
  echo "→ ${outfile} (recompress, crf=${crf})"
  ffmpeg -y -hide_banner -loglevel warning -i "$infile" \
    -c:v libx264 -crf "$crf" -preset slow \
    -vf "scale='min(${max_w},iw)':-2" \
    -an \
    -movflags +faststart \
    "${OUT_DIR}/${outfile}"
}

echo "Output: ${OUT_DIR}"
echo ""

# .mov → .mp4
convert_mov "member participation hub.mov" "member-participation-hub.mp4"
convert_mov "Spotlight (genai).mov" "spotlight.mp4"
convert_mov "view story from thread.mov" "view-story-from-thread.mp4"
convert_mov "notes (iOS).mov" "notes-midcard.mp4"
convert_mov "@mention (1).mov" "mention.mp4"
convert_mov "inbox tray.mov" "inbox-tray.mp4"
convert_mov "WA template.mov" "wa-template.mp4"
convert_mov "phoenix.mov" "phoenix.mp4" 28 1280
convert_mov "horizon website.mp4" "horizon-website.mp4"
convert_mov "horizon template.mov" "horizon-template.mp4"

# Already .mp4 in proto/
recompress_mp4 "early access.mp4" "early-access.mp4"
recompress_mp4 "breathe.mp4" "breathe.mp4" 24 1080

# Rounded-corner alpha WebM for Just Breathe wearable overlay (48px @ 600×576)
echo "→ breathe-rounded.webm (VP9 alpha, 48px corners)"
R=48
ffmpeg -y -hide_banner -loglevel warning -i "${OUT_DIR}/breathe.mp4" \
  -vf "format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gte(X,$R)*lte(X,W-$R),255,if(gte(Y,$R)*lte(Y,H-$R),255,if(lte(hypot($R-X,$R-Y),$R),255,if(lte(hypot(W-$R-1-X,$R-Y),$R),255,if(lte(hypot($R-X,H-$R-1-Y),$R),255,if(lte(hypot(W-$R-1-X,H-$R-1-Y),$R),255,0))))))'" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 \
  -an "${OUT_DIR}/breathe-rounded.webm"

echo ""
echo "Done. Sizes:"
ls -lh "${OUT_DIR}"

echo ""
echo "Optional: recompress root vr_feed (skip if assets/2026/vr_feed.mp4 is already fine):"
echo "  ffmpeg -y -i ../vr_feed.mp4 -c:v libx264 -crf 26 -preset slow -vf \"scale='min(1920,iw)':-2\" -an -movflags +faststart mp4/vr-feed.mp4"
