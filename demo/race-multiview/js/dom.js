// dom.js -- the three helpers more than one section of this page needs, and
// nothing else. It exists so that `el` is not written four times, not as a place
// for things that have no home.

/** A node, with an optional class and an optional text. */
export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/** One decimal and a unit, which is how every second on this page is written. */
export const secs = (value) => `${Number(value).toFixed(1)} s`;

/**
 * `id` -> the name it is listed by, taken off the rows of the selector.
 *
 * THE ROWS AND NOT THE VIEWS, and the difference is the programme. A catalogue
 * announces the feeds that can be added; the selector lists what a viewer can
 * see, which is those feeds AND the programme, under the name whoever published
 * it gave it. Reading the rows is how this page learns the name of the primary
 * content without knowing the id the contract gives it.
 *
 * And it is read rather than translated here on purpose. The whole argument for
 * a `name` field in an offer is that a catalogue somebody chooses from cannot be
 * a list of identifiers, so a page that turned an id into a readable word by
 * itself would be papering over the thing this demo is here to show.
 */
export const namesOf = (rows) => new Map(rows.map((row) => [row.id, row.name]));
