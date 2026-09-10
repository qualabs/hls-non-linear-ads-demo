// app.js -- the page of the hydration-break demo.
//
// It is two things and it marks which is which. The first is WHAT AN INTEGRATOR
// WRITES, and it is the block fenced below: the library arrives as a
// <script src> that defines a global, the page builds its own hls.js instance
// with the one configuration the library hands over, and turns the concurrent
// experience on over a container. Everything else on this page exists because
// this page is making an argument, and none of it is plumbing the library needs.
//
// What crosses out of the library is the contract -- `provider.activeAt(time)`
// and `provider.programRanges()` -- and nothing else.

import { runStory } from './story.js';
import { runOpening } from './opening.js';

// The signalled playlist: the same segments as the plate plus one Date Range,
// written by scripts/senalizar-contenido.sh on every start. Its START-DATE is
// computed from the playlist's own EXT-X-PROGRAM-DATE-TIME, so it cannot be a
// file in git: the clock moves every time the content is packaged.
const SRC = './content/primary/con-daterange.m3u8';

const video = document.getElementById('video');
const state = document.getElementById('state');
const hud = document.getElementById('hud');

// ===========================================================================
// WHAT AN INTEGRATOR WRITES  (with the <script src> and the container of
// index.html).
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player')
});
hls.loadSource(SRC);
hls.attachMedia(video);
// ===========================================================================

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) hud.textContent = `error: ${d.details}`;
});

hls.on(Hls.Events.MANIFEST_PARSED, () => {
  hud.textContent = `hls.js ${Hls.version} · playing ${SRC}`;
});

// Muted, so the autoplay policy lets the page start without a click. The audio
// control the library draws at the top right of the picture is the one that
// lifts it, and lifting it once at the start is a step of the run.
//
// AND THE PAGE DOES NOT PRESS PLAY: the walkthrough does, when its opening card
// goes (ADR 0039). Pressing it here as well showed the first seconds of the
// match before the card that says what is about to happen, which is the one
// thing the opening card exists to prevent. If the walkthrough cannot start, the
// handler at the bottom of this file presses it instead, so a broken story never
// costs the demo its player.
video.muted = true;

/**
 * THE STATE LINE, read off the contract and off nothing else.
 *
 * It says what is on screen right now, and it exists for the same reason the
 * page cannot lie: somebody watching has to be able to check that the ad they
 * are looking at is the ad the signalling declared. `activeAt` carries the type
 * of the layout and the MIME of every element, so the line can say whether the
 * ad on screen is a video or a still without the page knowing anything about
 * the asset-list.
 */
function shape(experience) {
  const assets = experience.elements.filter((e) => !e.primary);
  if (!assets.length) return experience.type;
  const stills = assets.every((e) => /^image\//i.test(e.mediaType || ''));
  return `${experience.type} · ${stills ? 'still image' : 'video'}`;
}

/**
 * The one moment of the minute where "nothing was replaced" reads backwards: the
 * linear ad, at full frame, with the programme still running underneath it. The
 * sentence is literally true there -- the primary was never stopped -- but
 * somebody watching a covered screen reads it as the opposite.
 *
 * So the line says the same thing the other way round when an element of the ad
 * COVERS the primary content. It is read off the contract and not off the type
 * of the ad: a covering ad is a box and a zDepth, and any layout that ever
 * declares one gets the same line without this page learning about it.
 */
function covering(active) {
  for (const experience of active) {
    const primary = experience.elements.find((e) => e.primary);
    if (!primary) continue;
    const over = experience.elements.some(
      (e) => !e.primary && e.zDepth > primary.zDepth && Object.values(e.box).every((v) => v === 0)
    );
    if (over) return true;
  }
  return false;
}

function paint() {
  const active = concurrent.provider.activeAt(video.currentTime);
  const t = video.currentTime.toFixed(1);
  state.textContent = active.length
    ? `${t}s · ad on screen: ${active.map(shape).join(', ')} · ` +
      (covering(active) ? 'the match is underneath, covered' : 'the match is still playing')
    : `${t}s · the match, no ad`;
}
video.addEventListener('timeupdate', paint);
paint();

// THE GUIDED RUN STARTS BY ITSELF, and that is the decision and not an
// oversight: somebody who opens this link from an email does not know there is a
// button, and without the walkthrough the business case is the thing they miss.
// One state and not two pages -- when it ends, the player is theirs.
//
// IT STARTS WHEN THE PICTURE IS ON SCREEN, and that is the one thing the opening
// changed. The page still never presses play itself: the walkthrough does, when its
// first card goes. What moved is WHEN the walkthrough is allowed to begin.
//
// AND EL DISPARADOR ES EL VIEWPORT Y NO EL SCROLL DE LA APERTURA, que fue el defecto
// que la apertura introdujo. Atado al final de la sección, el recorrido podía arrancar
// con el player todavía abajo del pliegue: las primeras placas corrían contra una
// pantalla que nadie estaba mirando y el espectador entraba tarde. Que la sección
// terminó y que la imagen se ve son dos cosas distintas, y la que importa es la
// segunda.
//
// EL UMBRAL ES 0,6 Y NO 0. Con 0 alcanza un píxel asomando por abajo, que es
// exactamente el caso que se quiere evitar; con 0,6 la imagen ya está mayormente en
// pantalla cuando aparece la primera placa. Y no arranca nunca si el lector se queda
// arriba leyendo, que es lo pedido y no un defecto.
const boton = document.getElementById('skip');
let corrida = null;

const arrancarLaCorrida = async () => {
  try {
    corrida = await runStory({
      provider: concurrent.provider,
      video,
      card: document.getElementById('card'),
      skip: boton
    });
  } catch (error) {
    // A walkthrough that cannot load is not a reason to lose the demo: the player
    // keeps playing and the console says what happened.
    console.error('[story] the walkthrough did not start, the player carries on', error);
    corrida = null;
    document.body.dataset.story = 'done';
    video.play().catch(() => {});
  }
};

const mirando = new IntersectionObserver((entradas) => {
  if (!entradas.some((e) => e.isIntersecting)) return;
  mirando.disconnect();
  arrancarLaCorrida();
}, { threshold: 0.6 });
mirando.observe(document.getElementById('player'));

// UN SOLO LISTENER PARA LOS DOS TRABAJOS DEL BOTÓN, y por eso el recorrido ya no se
// engancha solo. Con dos listeners sobre el mismo botón el orden decide el resultado:
// el del recorrido corre primero, marca `done`, y el de acá lo leía como "terminado" y
// reiniciaba en el mismo clic. Preguntando por el recorrido en lugar de por el atributo
// del body, la pregunta se contesta antes de que nadie la haya cambiado.
//
// A MITAD DE RECORRIDO EL BOTÓN SIGUE SIENDO EL DE SALTEAR. Es donde más se aprieta, y
// convertirlo en "reiniciar" ahí sería cambiarle el significado justo cuando la mano ya
// aprendió dónde está.
boton.addEventListener('click', () => {
  if (corrida?.running) return corrida.end();
  reiniciarLaCorrida();
});

// REINICIAR ES VOLVER AL PRINCIPIO Y NO ENCIMAR UN SEGUNDO RECORRIDO. La demo se
// muestra varias veces seguidas en un evento, y recargar la página devolvería al
// visitante a la apertura, que es peor que no tener botón. El estado que hay que
// deshacer es el que el recorrido toma: el programa parado en un segundo cualquiera y
// el atributo del body. La placa y el guard ya los soltó `end()` al terminar, que es la
// razón por la que ese release existe.
async function reiniciarLaCorrida() {
  video.pause();
  video.currentTime = 0;
  delete document.body.dataset.story;
  await arrancarLaCorrida();
}

// LOS RÓTULOS DEL BOTÓN VIVEN CON LOS BEATS (ADR 0038). `runStory` pone el de saltear
// cuando arma; el de reiniciar se pone cuando el recorrido termina, y se lee del mismo
// archivo para que quien edita el copy no tenga que abrir el código.
fetch('./story/story.json')
  .then((r) => r.json())
  .then((story) => {
    runOpening({ section: document.getElementById('opening'), lines: story.opening });
    if (!story.restart) return;
    new MutationObserver(() => {
      if (document.body.dataset.story === 'done') boton.textContent = story.restart;
    }).observe(document.body, { attributes: true, attributeFilter: ['data-story'] });
  })
  .catch((error) => {
    // A BROKEN OPENING CANNOT COST THE DEMO ITS PLAYER. If the file does not load the
    // section is hidden, and the player is then the first thing on the page, so the
    // observer above fires on its own.
    console.error('[opening] the opening did not load, the player is what is left', error);
    document.getElementById('opening').hidden = true;
  });

/**
 * THE SIGNALLING, SHOWN AS ITSELF, and read off what this player is actually playing
 * rather than typed into the page.
 *
 * It is the same rule the state line above obeys, applied to the scroll: this page
 * does not get to claim something it has not read. A tag pasted into the HTML would
 * be an illustration, and an illustration of a playlist is worth nothing to an
 * audience that reads playlists for a living -- besides which the START-DATE moves
 * every time the content is packaged, so a pasted one would be wrong by tomorrow.
 */
async function showSignalling() {
  const tag = document.getElementById('tag');
  const list = document.getElementById('list');
  try {
    const playlist = await fetch(SRC).then((r) => r.text());
    const line = playlist.split('\n').find((l) => l.startsWith('#EXT-X-DATERANGE:'));
    // Wrapped on the commas, because the real line is one long tag and a horizontal
    // scrollbar is a worse way to read it than four short lines.
    tag.textContent = line ? line.replace(/,(?=[A-Z-]+=)/g, ',\n  ') : 'no Date Range in the playlist';

    const url = line?.match(/X-ASSET-LIST="([^"]+)"/)?.[1];
    const assets = url ? await fetch(url).then((r) => r.json()) : null;
    // Only the shape of each asset, because the whole file is 100 lines and the point
    // is what a break declares, not every viewport of every box.
    list.textContent = assets
      ? JSON.stringify(assets.ASSETS.map((a) => {
        const block = a['X-AD-CREATIVE-SIGNALING']?.payload?.[0];
        return {
          URI: a.URI,
          DURATION: a.DURATION,
          type: block?.type ?? '(no layout block: a linear ad, played full frame)',
          ...(block ? { boxes: block.layout.assets.map((e) => `${e.type}  ${e.viewport}`) } : {})
        };
      }), null, 2)
      : 'no asset-list on the tag';
  } catch (error) {
    // Says what happened instead of leaving "loading…" on the page for good.
    tag.textContent = list.textContent = `could not read the signalling: ${error.message}`;
    console.error('[page] the signalling could not be shown', error);
  }
}
showSignalling();

// For the console and for whoever comes next.
window.demo = {
  hls,
  video,
  concurrent,
  provider: concurrent.provider,
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; }
};
