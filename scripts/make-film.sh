#!/usr/bin/env bash
# Turns the opening film clips into scroll frames (the Reposé technique).
#
#   1. Put your clips in  film/  named in order:  01-descent.mp4  02-rise.mp4  03-dusk.mp4  (any number, sorted by name)
#   2. Run:  bash scripts/make-film.sh            (needs ffmpeg:  brew install ffmpeg)
#   3. Frames land in public/film/<width>/0001.webp … plus public/film/manifest.json — the site picks them up automatically.
#
# Optional env: FPS (frames kept per second of footage, default 18), SETS (default "960 1920 2560"), Q (webp quality, default 72)
set -euo pipefail
cd "$(dirname "$0")/.."
FPS="${FPS:-18}"; SETS="${SETS:-960 1920 2560}"; Q="${Q:-72}"
shopt -s nullglob
clips=(film/*.mp4 film/*.mov film/*.webm)
[ ${#clips[@]} -gt 0 ] || { echo "No clips in film/ — add 01-descent.mp4, 02-rise.mp4, 03-dusk.mp4"; exit 1; }
IFS=$'\n' clips=($(printf '%s\n' "${clips[@]}" | sort)); unset IFS
echo "Clips: ${clips[*]}"

tmp=$(mktemp -d)
# normalise every clip to the same size/fps so they join cleanly (16:9, 2560 wide max)
i=0
for c in "${clips[@]}"; do
  i=$((i+1))
  ffmpeg -hide_banner -loglevel error -y -i "$c" -an \
    -vf "scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,fps=$FPS,format=yuv420p" \
    -c:v libx264 -crf 14 -preset veryfast "$tmp/$(printf %02d $i).mp4"
done
printf "file '%s'\n" "$tmp"/*.mp4 > "$tmp/list.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$tmp/list.txt" -c copy "$tmp/all.mp4"

rm -rf public/film; mkdir -p public/film
for w in $SETS; do
  mkdir -p "public/film/$w"
  ffmpeg -hide_banner -loglevel error -y -i "$tmp/all.mp4" -vf "scale=$w:-2" -c:v libwebp -quality "$Q" -compression_level 4 "public/film/$w/%04d.webp"
  echo "  $w px: $(ls public/film/$w | wc -l | tr -d ' ') frames, $(du -sh public/film/$w | cut -f1)"
done
count=$(ls public/film/$(echo $SETS | awk '{print $1}') | wc -l | tr -d ' ')
sets_json=$(echo $SETS | sed 's/ /, /g')
# keep tower geometry for the floor picker if it was already measured
geo=""
[ -f film/tower.json ] && geo=", \"tower\": $(cat film/tower.json)"
echo "{ \"count\": $count, \"sets\": [$sets_json], \"ext\": \"webp\", \"pad\": 4, \"fps\": $FPS$geo }" > public/film/manifest.json
rm -rf "$tmp"
echo "Done: $count frames → public/film/manifest.json"
