// opening.js -- la apertura de la página: negro, una frase enorme, y el scroll la
// achica antes de que empiece nada más.
//
// QUÉ TIENE QUE PASAR, en las palabras del pedido: "parece que está fijo pero en
// realidad cambia el tamaño y después sí empieza a bajar la página". Eso es un panel
// `sticky`: no se mueve mientras la sección que lo contiene sí, y cuando la sección se
// termina el panel se suelta y el resto de la página entra por abajo.
//
// LO ÚNICO QUE HACE ESTE ARCHIVO ES ESCRIBIR UN NÚMERO. `--t` va de 0 a 1 según cuánto
// se recorrió la sección, y todo lo demás —el cuerpo de la tipografía, qué frase se ve,
// cuánto queda de negro— lo resuelve el CSS a partir de ese número. Es lo que mantiene
// la estética en la hoja de estilos, que es donde se corrige mirando.
//
// Y NO SE USA `animation-timeline: scroll()`, que haría esto en CSS puro y sin una
// línea de JS. El soporte todavía no está en todos los navegadores y esta página se
// muestra en vivo: no es el lugar para estrenar soporte.
//
// EL VIDEO ARRANCA CUANDO LA APERTURA TERMINA, y ése es el otro trabajo de este
// archivo. La página nunca apretó play por su cuenta —lo hace el walkthrough cuando se
// va su primera card (ADR 0039)—, así que acá no se inventa un gate: se retrasa el que
// ya existía. `onDone` se llama UNA sola vez.

/** Arranca la apertura y avisa cuando termina.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.section  la sección alta que contiene el panel sticky
 * @param {string[]} opciones.lines       las frases, en orden (de `story.json`)
 * @param {() => void} opciones.onDone    se llama una vez, cuando la apertura termina
 * @returns {() => void} para soltarlo todo, si alguna vez hace falta
 */
export function runOpening({ section, lines, onDone }) {
  const panel = section.querySelector('[data-opening-panel]');
  if (!panel || !lines?.length) {
    // Sin panel o sin frases no hay apertura, y eso no puede costarle el video a nadie.
    section.hidden = true;
    onDone();
    return () => {};
  }

  for (const [i, texto] of lines.entries()) {
    const p = document.createElement('p');
    p.className = 'opening__line';
    p.textContent = texto;
    // Cada frase se enciende en su tramo de `--t`. Los tramos los reparte el CSS a
    // partir de este índice y del total, así que agregar una cuarta frase al JSON no
    // pide tocar nada acá ni allá.
    p.style.setProperty('--i', String(i));
    panel.append(p);
  }
  section.style.setProperty('--n', String(lines.length));

  let listo = false;
  const terminar = () => {
    if (listo) return;
    listo = true;
    section.dataset.done = '';
    onDone();
  };

  // EL CÁLCULO, y es una división. `top` es negativo mientras la sección sube: cuánto
  // de ella ya pasó por arriba del viewport. El recorrido útil es su alto menos una
  // pantalla, que es justo lo que el panel se queda pegado.
  let pedido = 0;
  const medir = () => {
    pedido = 0;
    const caja = section.getBoundingClientRect();
    const recorrido = Math.max(1, caja.height - window.innerHeight);
    const t = Math.min(1, Math.max(0, -caja.top / recorrido));
    section.style.setProperty('--t', t.toFixed(4));
    if (t >= 1) terminar();
  };

  // Throttle con rAF: el evento de scroll llega muchas veces por cuadro y el estilo se
  // escribe una sola vez por cuadro.
  const alScrollear = () => {
    if (pedido) return;
    pedido = requestAnimationFrame(medir);
  };

  window.addEventListener('scroll', alScrollear, { passive: true });
  window.addEventListener('resize', alScrollear, { passive: true });
  medir(); // Una recarga a mitad de página tiene que llegar con el valor correcto.

  return () => {
    window.removeEventListener('scroll', alScrollear);
    window.removeEventListener('resize', alScrollear);
    if (pedido) cancelAnimationFrame(pedido);
  };
}
