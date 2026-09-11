# El renderer de ANTES del arreglo, reconstruido a partir del de ahora dando
# vuelta los tres hunks. El md5 es el control: si no da ae2fc93..., la reversion
# no es exacta y la lectura en rojo no seria comparable.
import hashlib, sys

src = open(sys.argv[1]).read()

BLOQUE = '''
/**
 * WHICH ENTRY OF THE COMPOSITION A NODE IS, ASKED NOW'''
i = src.index(BLOQUE)
j = src.index('export function entryOf(drawn, node) {', i)
j = src.index('}\n', j) + 2
src = src[:i] + '\n' + src[j:]
src = src.replace('\n\n\n/**\n * @param provider', '\n\n/**\n * @param provider')

src = src.replace('''      node.addEventListener('ended', () => {
        // WHAT THIS NODE IS SHOWING IS ASKED AND NOT REMEMBERED (`entryOf`).
        // This listener is registered once and the composition around it
        // changes as often as somebody watching wants it to, so the element
        // and the window of the moment the node was made are both answers to
        // an old question. A node that is in no composition ran out off
        // screen, and there is neither a focus on it to let go nor a window to
        // measure it against.
        const entry = entryOf(drawn, node);
        if (!entry) return;
        // AND THE THIRD EXIT''', '''      node.addEventListener('ended', () => {
        // AND THE THIRD EXIT''')
src = src.replace('''        if (entry.element === focused) setFocus(null);
        const left = entry.experience.startTime + entry.experience.duration - video.currentTime;
        if (left <= CUT_TOLERANCE_SECONDS) return;
        console.warn(`[renderer] ${entry.element.id}: the asset ran out''', '''        if (element === focused) setFocus(null);
        const left = experience.startTime + experience.duration - video.currentTime;
        if (left <= CUT_TOLERANCE_SECONDS) return;
        console.warn(`[renderer] ${element.id}: the asset ran out''')

src = src.replace('''      //
      // AND WHICH BOX IT IS IS ASKED AT THE MOMENT OF THE TOUCH (`entryOf`).
      // The node names the box for as long as the box exists, which is longer
      // than the element the contract handed over for it the day the node was
      // made: a composition that changes shape around a box that never stopped
      // playing gives it a new element and the same node (ADR 0070). A gesture
      // that had kept the old one would move the focus onto an object that is
      // in no composition -- the whole composition at 0, no ring anywhere, and
      // nothing on the screen saying so.
      node.addEventListener('pointerdown', () => {
        if (!chromeUp()) return;
        const entry = entryOf(drawn, node);
        if (!entry) return;
        setFocus(entry.element === focused ? null : entry.element);
      });''', '''      node.addEventListener('pointerdown', () => {
        if (!chromeUp()) return;
        setFocus(element === focused ? null : element);
      });''')

open(sys.argv[2], 'w').write(src)
print('md5 del reconstruido:', hashlib.md5(src.encode()).hexdigest())
print('md5 esperado      : ae2fc93ca24894e8fae1244eb749dac7')
