import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

res = {}
reqs = []
console = []

MEASURE = """
() => {
  const { video, provider, renderer } = window.demo;
  const player = document.getElementById('player');
  const layer = document.getElementById('ads');
  const area = layer.getBoundingClientRect();
  const active = provider.activeAt(video.currentTime);
  const out = { time: +video.currentTime.toFixed(3),
                playerArea: { w: +area.width.toFixed(2), h: +area.height.toFixed(2) },
                fillMode: renderer.FILL_MODE, elements: [] };
  for (const exp of active) {
    out.type = exp.type; out.id = exp.id;
    out.window = [ +exp.startTime.toFixed(2), +(exp.startTime + exp.duration).toFixed(2) ];
    for (const el of exp.elements) {
      // Expected box: rule 1 of the contract, recomputed HERE from the
      // percentages, not asked of the renderer.
      const left = area.width * el.box.left / 100;
      const top = area.height * el.box.top / 100;
      const exp_px = { left, top,
        width: area.width - left - area.width * el.box.right / 100,
        height: area.height - top - area.height * el.box.bottom / 100 };
      const node = el.primary ? video : layer.querySelector(`.ad[data-element-id="${el.id}"]`);
      const r = node ? node.getBoundingClientRect() : null;
      const got = r ? { left: r.left - area.left, top: r.top - area.top, width: r.width, height: r.height } : null;
      const delta = got ? Math.max(Math.abs(got.left - exp_px.left), Math.abs(got.top - exp_px.top),
                                   Math.abs(got.width - exp_px.width), Math.abs(got.height - exp_px.height)) : null;
      const cs = node ? getComputedStyle(node) : null;
      out.elements.push({
        element: el.id, primary: el.primary, zDepth: el.zDepth, volume: el.volume,
        uri: el.uri, mediaType: el.mediaType,
        box: el.box,
        esperadoPx: exp_px && Object.fromEntries(Object.entries(exp_px).map(([k,v]) => [k, +v.toFixed(2)])),
        medidoPx: got && Object.fromEntries(Object.entries(got).map(([k,v]) => [k, +v.toFixed(2)])),
        deltaMaxPx: delta === null ? null : +delta.toFixed(4),
        objectFit: cs && cs.objectFit,
        zIndex: cs && cs.zIndex,
        drawn: !!node,
        video: node ? { readyState: node.readyState, paused: node.paused, currentTime: +node.currentTime.toFixed(2),
                        muted: node.muted, volume: node.volume,
                        w: node.videoWidth, h: node.videoHeight } : null
      });
    }
  }
  return out;
}
"""

AUDIO_STATE = """
() => {
  const video = window.demo.video;
  const ad = document.querySelector('#ads .ad');
  const s = (el) => el ? { muted: el.muted, volume: el.volume, paused: el.paused,
      currentTime: +el.currentTime.toFixed(2),
      audioBytes: el.webkitAudioDecodedByteCount ?? null } : null;
  return { primary: s(video), ad: s(ad),
           button: (() => { const b = document.getElementById('ad-audio');
             return { text: b.textContent.trim(), disabled: b.disabled }; })() };
}
"""

# Measures the audio that actually comes OUT of an element, by capturing its
# output stream and reading the analyser. Kept separate because it is the one
# check that could be defeated by how Chrome implements captureStream on a
# muted element -- if it does not discriminate, the numbers say so.
RMS = """
async () => {
  const pick = { primary: window.demo.video, ad: document.querySelector('#ads .ad') };
  const out = {};
  for (const [name, el] of Object.entries(pick)) {
    if (!el || !el.captureStream) { out[name] = null; continue; }
    try {
      const stream = el.captureStream();
      const tracks = stream.getAudioTracks();
      if (!tracks.length) { out[name] = { audioTracks: 0 }; continue; }
      const ctx = new AudioContext();
      await ctx.resume();
      const an = ctx.createAnalyser(); an.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let peak = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < 1200) {
        an.getFloatTimeDomainData(buf);
        for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
        await new Promise(r => setTimeout(r, 40));
      }
      out[name] = { audioTracks: tracks.length, peak: +peak.toFixed(5),
                    trackMuted: tracks[0].muted, trackEnabled: tracks[0].enabled,
                    ctxState: ctx.state };
      ctx.close();
    } catch (e) { out[name] = { error: String(e) }; }
  }
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    pg.set_viewport_size({"width": 1420, "height": 1020})
    pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:400]}))
    pg.on("request", lambda r: reqs.append({"url": r.url, "type": r.resource_type}))
    pg.on("response", lambda r: reqs.append({"resp": r.url, "status": r.status,
                                             "ct": r.headers.get("content-type")}))
    pg.goto(URL, wait_until="load")
    pg.bring_to_front()
    pg.wait_for_function("!!(window.demo && window.demo.provider && window.demo.renderer)", timeout=30000)
    pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

    # Roll into the window instead of landing inside it: seek just before the
    # START-DATE and let playback cross it, which is the transition the demo
    # actually does.
    pg.evaluate("() => { window.demo.video.currentTime = 19.0; }")
    pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0", timeout=30000)
    # Let the ad's first segments arrive and its first frame paint.
    pg.wait_for_function("(() => { const a = document.querySelector('#ads .ad'); return a && a.readyState >= 2 && !a.paused && a.currentTime > 0.2; })()", timeout=30000)
    time.sleep(1.0)

    res["geometria"] = pg.evaluate(MEASURE)
    print("GEOM", json.dumps(res["geometria"]["elements"], indent=1)[:1500], flush=True)

    pg.locator("#player").screenshot(path=str(OUT / "t07-cornerOverlay-player.png"))
    pg.screenshot(path=str(OUT / "t07-cornerOverlay-pagina.png"), full_page=True)

    # --- the audio control, ADR 0010 ---
    res["audio"] = {"antes": pg.evaluate(AUDIO_STATE)}
    res["audio"]["rms_antes"] = pg.evaluate(RMS)
    # A real click: it is also the user gesture that lets the page have sound.
    pg.locator("#ad-audio").click()
    time.sleep(0.6)
    res["audio"]["despues_del_click"] = pg.evaluate(AUDIO_STATE)
    # The primary's audio is turned on with its own control (the native one);
    # here it is set directly, which the click above has already authorised.
    pg.evaluate("() => { window.demo.video.muted = false; window.demo.video.volume = 1; }")
    time.sleep(0.5)
    res["audio"]["con_los_dos_encendidos"] = pg.evaluate(AUDIO_STATE)
    res["audio"]["rms_los_dos"] = pg.evaluate(RMS)
    # Decoded audio bytes over a second, for both elements at once: it says
    # each element is decoding its own audio track, not that it is audible.
    res["audio"]["bytes_1s"] = pg.evaluate("""
      async () => {
        const a = window.demo.video, b = document.querySelector('#ads .ad');
        const r0 = { primary: a.webkitAudioDecodedByteCount, ad: b.webkitAudioDecodedByteCount };
        await new Promise(r => setTimeout(r, 1000));
        return { primary: a.webkitAudioDecodedByteCount - r0.primary,
                 ad: b.webkitAudioDecodedByteCount - r0.ad };
      }
    """)
    pg.locator("#player").screenshot(path=str(OUT / "t07-audio-del-aviso-activo.png"))
    # And off again, to check the control is a toggle and not a one-way switch.
    pg.locator("#ad-audio").click()
    time.sleep(0.4)
    res["audio"]["despues_de_apagar"] = pg.evaluate(AUDIO_STATE)

    # The box after a resize: the renderer recomputes pixels, so it has to hold.
    pg.set_viewport_size({"width": 1000, "height": 800})
    time.sleep(0.6)
    res["geometria_resize"] = pg.evaluate(MEASURE)
    pg.set_viewport_size({"width": 1420, "height": 1020})
    time.sleep(0.6)

    # Out of the window: the ad has to disappear and the primary come back.
    pg.evaluate("() => { window.demo.video.currentTime = 40; }")
    pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0", timeout=20000)
    time.sleep(0.6)
    res["despues_de_la_ventana"] = pg.evaluate("""
      () => ({ ads: document.querySelectorAll('#ads .ad').length,
               primaryStyle: document.getElementById('video').getAttribute('style'),
               button: document.getElementById('ad-audio').textContent.trim(),
               buttonDisabled: document.getElementById('ad-audio').disabled,
               contract: document.getElementById('contract').textContent })
    """)

res["red"] = reqs
res["consola"] = console
(OUT / "t07-medicion.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t07-medicion.json")
