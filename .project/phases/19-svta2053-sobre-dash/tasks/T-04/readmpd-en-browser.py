import json, sys
from playwright.sync_api import sync_playwright
base = sys.argv[1]
JS = """async () => {
  const { readMpd } = await import('/dash/signalling.js');
  const text = await (await fetch('/test/fixtures/dash/breaks.mpd')).text();
  const want = await (await fetch('/test/fixtures/dash/breaks.json')).json();
  const got = readMpd(new DOMParser().parseFromString(text, 'text/xml'));
  const same = JSON.stringify(got) === JSON.stringify(want);
  // the control: the same reading against a copy of the expected with one body changed
  const broken = structuredClone(want); broken.periods[0].eventStreams[0].events[1].body += ' ';
  return { same, control: JSON.stringify(got) === JSON.stringify(broken), events: got.periods.flatMap(p => p.eventStreams.flatMap(s => s.events)).length,
           firstBody: got.periods[0].eventStreams[0].events[0].body.slice(0, 40) };
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(); pg.goto(base + "/README.md")
    print(json.dumps(pg.evaluate(JS)))
    b.close()
