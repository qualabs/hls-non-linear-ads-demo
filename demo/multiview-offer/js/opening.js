// opening.js -- the four sentences the page opens on, and the one number that
// drives them.
//
// THE ONLY INPUT IS `--t`: how much of the opening section has already scrolled
// past, from 0 to 1. Everything the reader sees -- the type shrinking, one
// sentence handing over to the next, the last one holding until the picture
// covers it -- is derived from that single custom property in the stylesheet.
// Nothing here animates on a timer and nothing here measures type.
//
// WHY IT IS WRITTEN ONCE PER FRAME AND NOT ON EVERY SCROLL EVENT. Scroll fires
// far more often than the screen is painted, and each one of those would be a
// style write. `requestAnimationFrame` collapses a burst of them into the one
// write the frame is going to use, which is the same reason the rendering side
// of this library places boxes in a frame loop and not in an event handler.
//
// THE COUNT OF SENTENCES IS READ AND NOT CONFIGURED. `--n` is however many
// `.opening__line` there are in the markup, and `--i` is each one's place in the
// list, so a fifth sentence is a fifth <p> and nothing else: no number to bump
// here and none in the stylesheet.

/**
 * Drive the opening of a section that holds a sticky panel.
 *
 * @param section  the tall section. Its height is what the scroll is measured
 *                 against, and the panel inside it is what stays put.
 */
export function runOpening(section) {
  if (!section) return;
  const lines = [...section.querySelectorAll('.opening__line')];
  if (!lines.length) {
    // A section with no sentences would leave a tall black hole above the
    // player, which is worse than no opening at all.
    section.hidden = true;
    return;
  }
  section.style.setProperty('--n', String(lines.length));
  lines.forEach((line, i) => line.style.setProperty('--i', String(i)));

  let queued = false;
  const write = () => {
    queued = false;
    // The panel is one viewport tall and sticky, so the section scrolls for its
    // own height minus that one screen. Guarded against zero: a section shorter
    // than the viewport has no scroll of its own, and dividing by it would put
    // `--t` at infinity and every sentence at once.
    const travel = section.offsetHeight - window.innerHeight;
    const scrolled = window.scrollY - section.offsetTop;
    const t = travel > 0 ? Math.min(1, Math.max(0, scrolled / travel)) : 1;
    section.style.setProperty('--t', t.toFixed(4));
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(write);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  write();
}
