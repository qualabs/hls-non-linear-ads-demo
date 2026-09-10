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
// Y ESTE ARCHIVO NO DECIDE CUÁNDO ARRANCA EL VIDEO. Lo decide `app.js`, mirando si la
// imagen está efectivamente en pantalla. Acá se intentó primero avisar cuando la
// sección terminaba, y era el disparador equivocado: la sección se termina en el
// scroll, y lo que importa es el viewport — con la apertura terminada el player todavía
// puede estar abajo del pliegue, y el recorrido arrancaba contra una pantalla que nadie
// estaba mirando.

/** Arranca la apertura y avisa cuando termina.
 *
 * @param {object} opciones
 * @param {HTMLElement} opciones.section  la sección alta que contiene el panel sticky
 * @param {string[]} opciones.lines       las frases, en orden (de `story.json`)
 * @returns {() => void} para soltarlo todo, si alguna vez hace falta
 */
export function runOpening({ section, lines }) {
  const panel = section.querySelector('[data-opening-panel]');
  if (!panel || !lines?.length) {
    // Sin panel o sin frases no hay apertura, y eso no puede costarle el video a nadie:
    // escondida la sección, el player pasa a ser lo primero de la página y el
    // observador de `app.js` lo ve solo.
    section.hidden = true;
    return () => {};
  }

  for (const [i, texto] of lines.entries()) {
    const p = document.createElement('p');
    p.className = 'opening__line';
    // UN GUION NO ES UN LUGAR PARA CORTAR EL RENGLON, y acá se vio: "Introducing
    // Non-linear Ads for HLS" cortaba en "Introducing Non-" / "linear Ads for HLS",
    // partiendo el nombre de la cosa al medio. El JUNTADOR DE PALABRAS (U+2060) es de
    // ancho cero y no se ve: el texto que se lee es exactamente el que está en
    // `story.json`, y el renglón corta en un espacio como corresponde. Se hace acá y no
    // en el JSON para que el archivo que edita quien escribe el copy no tenga adentro
    // un carácter invisible que nadie puede explicar.
    p.textContent = texto.replace(/-/g, '-\u2060');
    // Cada frase se enciende en su tramo de `--t`. Los tramos los reparte el CSS a
    // partir de este índice y del total, así que agregar una cuarta frase al JSON no
    // pide tocar nada acá ni allá.
    p.style.setProperty('--i', String(i));
    panel.append(p);
  }
  section.style.setProperty('--n', String(lines.length));

  // `data-done` no dispara nada: es lo que deja ver desde afuera —una prueba, la
  // consola— que la apertura llegó al final.
  const terminar = () => { section.dataset.done = ''; };

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
