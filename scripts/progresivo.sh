#!/usr/bin/env bash
# progresivo.sh -- the progressive MP4 of a creative, out of its published HLS, and
# the `codecs` that file really has.
#
#   scripts/progresivo.sh <hls> <mp4> <width> <height> <bitrate>
#   scripts/progresivo.sh --verificar <mp4> <hls> <width> <height>
#
# Prints one line on stdout and nothing else: the RFC 6381 codecs string of the file
# it wrote, `vp09.PP.LL.BB`. Whoever calls it records that string next to the path
# (stage.json in stage-pair; the asset-list of hydration-break is checked against it).
#
# WHY IT EXISTS (phase 17, ADR 0096). A Roku draws neither an SVG nor a second HLS. What
# it can animate over the programme without taking its one video decoder is a short
# progressive MP4 in VP9, through AnimatedImage. So next to every HLS box the demos
# publish this file, and the asset-list offers it as the twin option of the HLS one.
#
# WHY FROM THE HLS AND NOT FROM THE FRAMES (ADR 0098). The frames the HLS was packaged
# from are not kept, and capturing them again re-packages the HLS the web plays. Out
# of the published HLS, the HLS is left byte for byte as it is, and the MP4 is that
# same creative, frame for frame. The cost is one more generation of compression, and
# what shows is decided by the VP9 bitrate anyway.
#
# THE FORMAT. VP9 profile 0, 8 bits, 4:2:0, NO AUDIO (AnimatedImage plays none), and
# the WHOLE length of the HLS: on the Roku a file that ends before its window leaves
# the box frozen. The sizes and bitrates are not chosen here: each demo declares them
# with its other numbers (ADR 0044), and they are the ones the Roku channel measured
# on the device in its phase 01.
#
# WHY `codecs` IS READ AND NOT WRITTEN (ADR 0100). The VP9 level depends on the
# picture size and the frame rate: 960x540 at 30 fps is level 3, the 1120x126 banner
# 2.1, the 320x180 corner 1.1. One string for all three would be false for two of
# them. ffmpeg writes profile, level and bit depth into the `vpcC` box of the MP4, so
# the string comes out of the file that was just written.
#
# --verificar runs the same checks on a file that already exists and prints its
# codecs, which is how a hand-written asset-list is checked against its file.
#
# IT REFUSES, rather than leaving a file that looks right: a stream that is not VP9,
# any audio stream, or a length that differs from the sum of the #EXTINF of the HLS
# by more than one frame.
set -euo pipefail

# The checks, and the reading of `codecs`: on the file just written, or on one given.
verify() { # $1 mp4, $2 hls, $3 width, $4 height
  python3 - "$@" <<'PY'
import json, subprocess, sys

mp4, hls, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

def fail(msg):
    print(f"progresivo: {msg}", file=sys.stderr)
    sys.exit(1)

import os
if not os.path.isfile(mp4):
    fail(f"{mp4}: does not exist")

probe = json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4],
    check=True, capture_output=True, text=True).stdout)
streams = probe.get("streams", [])
video = [s for s in streams if s.get("codec_type") == "video"]
others = [s for s in streams if s.get("codec_type") != "video"]
if len(video) != 1 or video[0].get("codec_name") != "vp9":
    fail(f"{mp4}: expected one VP9 video stream, found {[s.get('codec_name') for s in video]}")
if others:
    fail(f"{mp4}: carries {[s.get('codec_type') for s in others]} besides the video, and must carry nothing")
if (video[0].get("width"), video[0].get("height")) != (w, h):
    fail(f"{mp4}: is {video[0].get('width')}x{video[0].get('height')}, asked for {w}x{h}")

extinf = 0.0
for line in open(hls, encoding="utf-8"):
    if line.startswith("#EXTINF:"):
        extinf += float(line[8:].split(",")[0])
if extinf <= 0:
    fail(f"{hls}: no #EXTINF to measure the length against")
num, den = (video[0].get("avg_frame_rate") or "30/1").split("/")
frame = float(den) / float(num)
length = float(probe["format"]["duration"])
if abs(length - extinf) > frame + 1e-6:
    fail(f"{mp4}: lasts {length:.3f} s and its HLS {extinf:.3f} s, more than one frame apart")

# The `vpcC` box (VP Codec ISO Media File Format Binding, section 2.2): a full box,
# version 1, then profile (8 bits), level (8 bits), and bitDepth in the high four bits
# of the next byte.
data = open(mp4, "rb").read()
at = data.find(b"vpcC")
if at < 0:
    fail(f"{mp4}: has no vpcC box, so its codecs cannot be read")
version = data[at + 4]
if version != 1:
    fail(f"{mp4}: vpcC version {version}, only version 1 is read here")
profile, level, depth = data[at + 8], data[at + 9], data[at + 10] >> 4
print(f"vp09.{profile:02d}.{level:02d}.{depth:02d}")
PY
}

if [ "${1:-}" = "--verificar" ]; then
  verify "${2:?mp4}" "${3:?hls playlist}" "${4:?width}" "${5:?height}"
  exit
fi

HLS=${1:?hls playlist} MP4=${2:?output mp4} W=${3:?width} H=${4:?height} BV=${5:?bitrate}

TMP=$(mktemp -d "${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/progresivo-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$(dirname "$MP4")"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$HLS" \
  -vf "scale=${W}:${H}:flags=lanczos,setsar=1,format=yuv420p" -an \
  -c:v libvpx-vp9 -profile:v 0 -b:v "$BV" -row-mt 1 \
  -movflags +faststart "$TMP/out.mp4"

CODECS=$(verify "$TMP/out.mp4" "$HLS" "$W" "$H")
mv "$TMP/out.mp4" "$MP4"
echo "$CODECS"
