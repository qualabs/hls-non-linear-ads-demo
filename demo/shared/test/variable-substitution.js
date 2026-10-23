// variable-substitution.js -- what a client makes of a playlist that chooses the
// class of its ad breaks with a query parameter (ADR 0113), so that the tests of
// every demo can read a generated playlist the way each of its two clients reads
// it.
//
// THE RULES ARE THE SPEC'S, AND THE CLIENT THAT APPLIES THEM IN THE BROWSER IS
// hls.js. draft-pantos-hls-rfc8216bis-22, 4.3 and 4.4.2.3: an EXT-X-DEFINE with
// QUERYPARAM takes its value from the query parameter of that name in the URI of
// the playlist, percent-decoded; a reference `{$name}` inside a quoted-string
// attribute value or a URI line is replaced by the value of a variable DEFINED
// BEFORE it; and a missing parameter, a reference to an undefined variable or a
// name defined twice are all a playlist the client MUST fail to parse. hls.js
// 1.7.2 does the same in `utils/variable-substitution.ts`, applied by
// `AttrList.parseAttrList` to every quoted-string value -- the EXT-X-DATERANGE
// ones included, CLASS and X-ASSET-LIST among them -- before the Date Range
// reaches `details.dateRanges` or the interstitials controller.
//
// It is a helper of the tests and nothing else: no page loads it. A page never
// needs it, because the substitution happens inside hls.js.

const REFERENCE = /\{\$([a-zA-Z0-9_-]+)\}/g;

/** The attributes of an attribute-list, quoted values unquoted. */
function attributes(list) {
  const out = {};
  for (const [, name, value] of list.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
    out[name] = value.startsWith('"') ? value.slice(1, -1) : value;
  }
  return out;
}

/**
 * The playlist as a client that loaded it from `url` reads it: every reference
 * replaced. Throws where the spec says the client must fail to parse.
 *
 * @param playlist the text of the playlist
 * @param url      the URI it was loaded from, query included
 * @returns        `{ text, variables }`
 */
export function substitute(playlist, url) {
  const query = new URL(url, 'http://localhost/').searchParams;
  const variables = {};
  const lines = playlist.split('\n').map((line) => {
    if (line.startsWith('#EXT-X-DEFINE:')) {
      const attr = attributes(line.slice('#EXT-X-DEFINE:'.length));
      let name;
      let value;
      if ('QUERYPARAM' in attr) {
        name = attr.QUERYPARAM;
        if (!query.has(name) || query.get(name) === '') {
          throw new Error(`EXT-X-DEFINE QUERYPARAM "${name}" matches no query parameter of ${url}`);
        }
        value = query.get(name);
      } else if ('NAME' in attr) {
        name = attr.NAME;
        value = attr.VALUE ?? '';
      } else {
        throw new Error(`EXT-X-DEFINE without NAME or QUERYPARAM: ${line}`);
      }
      if (name in variables) throw new Error(`EXT-X-DEFINE duplicate Variable Name "${name}"`);
      variables[name] = value;
      return line;
    }
    return line.replace(REFERENCE, (_whole, name) => {
      if (!(name in variables)) throw new Error(`Variable Reference "${name}" with no preceding EXT-X-DEFINE`);
      return variables[name];
    });
  });
  return { text: lines.join('\n'), variables };
}

/** The playlist URL a page loads, with the class its client takes. */
export const withClass = (path, param, hlsClass) => `${path}?${param}=${encodeURIComponent(hlsClass)}`;
