#!/bin/bash
# The rename of T-02 of phase 19, as a pure sed: the identifiers that name the HLS asset-list
# in the functions of hls/signalling.js that move to lib/, so they can cross the seam of ADR
# 0003. `assetList` is renamed only as the parameter of those functions (lines 132-601 of
# bb0d78b): elsewhere it is hls.js's own property, `event.assetList`, and a local of the HLS
# wiring that stays.
set -euo pipefail
sed -i -E -e 's/\bresolveAssetList\b/resolveAssets/g' -e 's/\bassetListUrl\b/listRequestUrl/g' -e '132,601s/\bassetList\b/adList/g' hls/signalling.js
for f in $(git grep -l -w -E 'resolveAssetList|assetListUrl' -- test 'demo/*/test/*.js'); do
  sed -i -E -e 's/\bresolveAssetList\b/resolveAssets/g' -e 's/\bassetListUrl\b/listRequestUrl/g' "$f"
done
