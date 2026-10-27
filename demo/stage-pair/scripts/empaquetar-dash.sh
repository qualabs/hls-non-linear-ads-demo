#!/usr/bin/env bash
# empaquetar-dash.sh -- the same programme and the same creatives, in MPEG-DASH,
# for the DASH pane of the pair (phase 19, ADR 0127).
#
#   demo/stage-pair/scripts/empaquetar-dash.sh            (from anywhere)
#
# IT IS A REMUX AND NOT AN ENCODE. Each HLS rendition the demo already packaged
# (content/primary/index.m3u8, and the `video` of every piece of stage.json) is
# copied, stream for stream, into fragmented MP4 with its MPD, in a `dash/`
# folder next to its playlist: `<folder>/dash/manifest.mpd`. dash.js does not play
# MPEG-TS, so the container has to change; the frames, the cadence, the GOP and
# the audio do not, which is what makes the two panes the same programme and the
# same ads. And it needs neither MP4Box nor shaka-packager, which this machine
# does not have: ffmpeg's dash muxer with `-c copy`.
#
# THE TIMELINE STARTS WHERE THE HLS ONE DOES, AND IT IS MEASURED. hls.js puts the
# first frame of the programme at 0.066733 s: its first timestamp minus the 1.4 s
# of MPEG-TS offset. `-copyts -output_ts_offset -1.4` writes the fragmented MP4
# with that same timeline, so the MPD's first segment starts at 0.0667 s and
# needs no @presentationTimeOffset: dash.js shows the same frame as hls.js at
# the same second, pixel for pixel, for the programme and for a creative (T-06
# and T-07 of phase 19, tasks/). The two alternatives that look right are wrong,
# and both were measured: `-copyts` alone leaves the first segment at 1.4667 s,
# and dash.js jumps that "gap" when a player starts at 0, so a creative began
# 1.47 s into its animation; and a @presentationTimeOffset of 1.4 s moved the
# whole DASH programme 1.4 s early.
#
# Segments of 2 s, which is the -hls_time of the HLS packaging, so a segment
# boundary is a keyframe in both. SegmentTimeline, because the TS segments are not
# all 2 s long (the first is 3.04 s) and a fixed @duration would drift.
#
# content/ is not in git: like the HLS packaging, this writes there and any clone
# rebuilds it with one command.
set -euo pipefail
DEMO=$(cd "$(dirname "$0")/.." && pwd)
cd "$DEMO"

remux() {
  local playlist=$1 out
  out="$(dirname "$playlist")/dash"
  [ -f "$playlist" ] || { echo "empaquetar-dash: $playlist does not exist; package the HLS first" >&2; exit 1; }
  rm -rf "$out"
  mkdir -p "$out"
  ffmpeg -hide_banner -loglevel error -y -copyts -i "$playlist" -output_ts_offset -1.4 -map 0 -c copy -tag:v avc1 -tag:a mp4a -bsf:a aac_adtstoasc \
    -f dash -seg_duration 2 -use_template 1 -use_timeline 1 \
    -init_seg_name 'init-$RepresentationID$.m4s' -media_seg_name 'seg-$RepresentationID$-$Number%05d$.m4s' \
    "$out/manifest.mpd"
  echo "empaquetar-dash: $out/manifest.mpd ($(find "$out" -name '*.m4s' | wc -l) segments)"
}

remux content/primary/index.m3u8
node -e '
  const s = require(process.argv[1]);
  const videos = [...new Set(s.assets.piezas.map((p) => p.video).filter(Boolean))];
  process.stdout.write(videos.join("\n") + "\n");
' "$DEMO/stage.json" | while read -r video; do remux "$video"; done
