# T-06 of phase 19: does a second of the DASH programme show the same frame as that second of the HLS one?
import json, sys
from playwright.sync_api import sync_playwright
JS = """async ({ t, dt }) => {
  const make = () => { const v = document.createElement('video'); v.muted = true; v.width = 320; v.height = 180; document.body.append(v); return v; };
  const h = make(), d = make();
  const hls = new Hls(); hls.loadSource('/content/creatives/ketrava-16x9/index.m3u8'); hls.attachMedia(h);
  const dp = dashjs.MediaPlayer().create(); dp.initialize(d, '/content/creatives/ketrava-16x9/dash/manifest.mpd', false);
  const ready = (v) => new Promise((r) => v.readyState >= 2 ? r() : v.addEventListener('loadeddata', r, { once: true }));
  await Promise.all([ready(h), ready(d)]);
  const start = { hls: h.buffered.length ? h.buffered.start(0) : null, dash: d.buffered.length ? d.buffered.start(0) : null };
  const seek = (v, x) => new Promise((r) => { v.addEventListener('seeked', () => setTimeout(r, 300), { once: true }); v.currentTime = x; });
  const frame = (v) => { const c = document.createElement('canvas'); c.width = 160; c.height = 90; const g = c.getContext('2d'); g.drawImage(v, 0, 0, 160, 90); return g.getImageData(0, 0, 160, 90).data; };
  const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]); return +(s / (a.length / 4) / 3).toFixed(2); };
  const out = { start, frames: [] };
  for (const at of t) {
    await Promise.all([seek(h, at), seek(d, at)]);
    const same = diff(frame(h), frame(d));
    await seek(d, at + dt);
    const shifted = diff(frame(h), frame(d));
    out.frames.push({ at, hlsTime: h.currentTime, dashTime: d.currentTime - dt, same, shiftedBy: dt, shifted });
  }
  return out;
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(sys.argv[1] + "/inspect.html")
    pg.set_content("<html><body></body></html>")
    pg.add_script_tag(url=sys.argv[1] + "/vendor/hls.min.js"); pg.add_script_tag(url=sys.argv[1] + "/vendor/dash.all.min.js")
    import os
    sweep = [round(-2 + i / 29.97, 3) for i in range(0, 121, 2)]
    if os.environ.get("SWEEP"):
        print(json.dumps(pg.evaluate(JS.replace("for (const at of t) {", "for (const at of t) for (const dd of SWEEP) { const dt = dd;").replace("async ({ t, dt })", "async ({ t, SWEEP })"), {"t": [6.5], "SWEEP": sweep})))
    else:
        print(json.dumps(pg.evaluate(JS, {"t": [3.0, 6.5, 9.0], "dt": 0.1}), indent=1), errs)
    b.close()
