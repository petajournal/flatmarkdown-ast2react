// The rule of the hrefs of wikilinks and hashtags. It is the rule of flatmarkdown-ast2html, the
// Rust renderer, written again in TypeScript. The two are kept the same by one table:
// testdata/hrefs.json is a copy of the table of the flatmarkdown repository.

/** The part of an href template that is replaced by the name. */
const NAME = '{}';

/**
 * `name` percent-encoded: what `encodeURI` encodes, and `?` and `#` too. `/` stays, because it
 * separates the folders in the name of a page.
 */
function encoded(name: string): string {
  return encodeURI(name).replaceAll('?', '%3F').replaceAll('#', '%23');
}

/** The URL that `template` makes for `name`: every `{}` takes the percent-encoded name. */
function fillHref(template: string, name: string): string {
  return template.replaceAll(NAME, encoded(name));
}

/** The last pattern of a fragment and its regular expression, because a page has many links. */
let last: { pattern: string; regex: RegExp | null } | null = null;

/** Whether `pattern` matches the whole `text`. An empty or broken pattern matches nothing. */
function isFragment(pattern: string, text: string): boolean {
  if (pattern === '') return false;
  if (last?.pattern !== pattern) {
    let regex: RegExp | null;
    try {
      regex = new RegExp(`^(?:${pattern})$`);
    } catch {
      regex = null;
    }
    last = { pattern, regex };
  }
  return last.regex?.test(text) ?? false;
}

/**
 * The href of a wikilink to `url`. When `fragmentPattern` matches the whole text after the last
 * `#`, that text is the fragment and goes after the filled template. Otherwise the whole URL is
 * the name.
 */
export function wikilinkHref(template: string, fragmentPattern: string, url: string): string {
  const hash = url.lastIndexOf('#');
  if (hash >= 0) {
    const fragment = url.slice(hash + 1);
    if (isFragment(fragmentPattern, fragment)) {
      return `${fillHref(template, url.slice(0, hash))}#${encoded(fragment)}`;
    }
  }
  return fillHref(template, url);
}

/** The href of a hashtag of the tag `name`. */
export function hashtagHref(template: string, name: string): string {
  return fillHref(template, name);
}

/** The template of the options when an app gives none: the name alone. */
export const DEFAULT_HREF = NAME;
