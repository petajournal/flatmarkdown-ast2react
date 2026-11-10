# flatmarkdown-ast2react

Render [FlatMarkdown](https://github.com/petajournal/flatmarkdown) AST as native React components, with wikilink support for SPA navigation.

## Installation

```bash
npm install flatmarkdown-ast2react flatmarkdown-ast
```

Peer dependency: `react` (^19.0.0).

## Usage

```tsx
import { FmRoot } from 'flatmarkdown-ast2react';
import type { AstNode } from 'flatmarkdown-ast';

const ast: AstNode = {
  type: 'document',
  children: [
    {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'Hello ' },
        { type: 'strong', children: [{ type: 'text', value: 'world' }] },
      ],
    },
  ],
};

function Article() {
  return <FmRoot ast={ast} />;
}
```

`FmRoot` accepts:
- `ast` — An `AstNode` object or a JSON string of the AST.
- `options` — Optional `ReactRenderOptions`.

### JSON string input

```tsx
// Directly from flatmarkdown CLI/WASM/server output
<FmRoot ast='{"type":"document","children":[{"type":"paragraph","children":[{"type":"text","value":"Hi"}]}]}' />
```

## Wikilink Options

```ts
import type { ReactRenderOptions } from 'flatmarkdown-ast2react';

const options: ReactRenderOptions = {
  wikilink: {
    hrefPrefix: '/wiki/',
    cssClass: 'wiki-link',
  },
};

<FmRoot ast={ast} options={options} />
```

Wikilinks render as `<a href="/wiki/page-name" data-wikilink="true">` by default.

### Custom Link Component

Pass a custom `linkComponent` for SPA navigation (e.g. react-router's `Link`):

```tsx
import { Link } from 'react-router-dom';

const options: ReactRenderOptions = {
  wikilink: {
    linkComponent: Link,
    hrefPrefix: '/wiki/',
    cssClass: 'wiki-link',
  },
};

<FmRoot ast={ast} options={options} />
```

### ReactRenderOptions

```ts
interface ReactRenderOptions {
  wikilink?: WikiLinkReactOptions;
  hashtag?: HashtagReactOptions;
  embed?: EmbedReactOptions;
}

interface EmbedReactOptions {
  /** An absolute URL that the URL of an embed is resolved against. Default: none */
  baseUrl?: string;
}

interface HashtagReactOptions {
  /** Prefix prepended to the tag name for href/to. Default: `hrefPrefix` of the wikilink options. */
  hrefPrefix?: string;
  /** CSS class applied to hashtag anchors. Default: 'hashtag' */
  cssClass?: string;
}

interface WikiLinkReactOptions {
  /** Custom link component (e.g. react-router's Link). Receives `to` and `children`. */
  linkComponent?: ComponentType<{ to: string; className?: string | null; children?: ReactNode }>;
  /** Prefix prepended to the wikilink url for href/to. Default: '' */
  hrefPrefix?: string;
  /** CSS class applied to wikilink anchors. */
  cssClass?: string;
}
```

## Hashtag Options

A hashtag is a link to the page of the tag.
`#diary` renders as `<a href="diary" class="hashtag" data-hashtag="true">#diary</a>` by default.

```ts
const options: ReactRenderOptions = {
  wikilink: { hrefPrefix: '/wiki/' },
  hashtag: {
    hrefPrefix: '/wiki/tags/',
    cssClass: 'hashtag-link',
  },
};
```

- `hrefPrefix` is for an app that keeps the tag pages in their own folder. Without it, a hashtag uses `hrefPrefix` of the wikilink options.
- `cssClass` replaces the default class `hashtag`.
- A hashtag uses `linkComponent` of the wikilink options, because both are links to a page.

## Embed Options

An embed (`![alt](url)`) renders as `<img>`.
`w` and `h` of its properties become the width and the height: `![pic](pic.png#w=300&h=240)` renders as `<img src="pic.png" alt="pic" width="300" height="240">`.
A `w` or an `h` that is not a positive whole number is ignored.

```ts
const options: ReactRenderOptions = {
  embed: { baseUrl: 'https://example.com/pages/' },
};
```

- `baseUrl` is for an app that runs at another address than the pages. The URL of an embed is resolved against it, as a browser resolves a relative URL against the address of a page. With the options above, `../assets/pic.png` becomes `https://example.com/assets/pic.png`.
- An absolute URL of an embed stays as it is.
- `baseUrl` must be an absolute URL.
- Without `baseUrl`, the URL is used as written.

## Supported AST Node Types

37 node types, as flatmarkdown 0.5.0 makes them. They are defined in [SPEC_AST.md](https://github.com/petajournal/flatmarkdown/blob/main/SPEC_AST.md).

**Block (17):** `document`, `paragraph`, `heading`, `code_block`, `block_quote`, `multiline_block_quote`, `list`, `item`, `task_item`, `table`, `table_row`, `table_cell`, `thematic_break`, `html_block`, `footnote_definition`, `alert`, `subtext`

**Inline (20):** `text`, `softbreak`, `linebreak`, `emph`, `strong`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript`, `spoilered_text`, `code`, `link`, `embed`, `wikilink`, `footnote_reference`, `shortcode`, `math`, `html_inline`, `hashtag`

A node with an unknown type renders its children only. So the text inside a node of a newer parser is not lost.

## Rendered HTML

The elements are the same as in the HTML that the `flatmarkdown` Rust crate writes.

| Node | Rendered as |
|---|---|
| `embed` | `<img src alt title width height>`. The alt is the text of the children. The width and the height come from `w` and `h` of `props` |
| `hashtag` | `<a href="tag" class="hashtag" data-hashtag="true">#tag</a>` |
| `wikilink` | `<a href="page" data-wikilink="true">label</a>` |
| `footnote_reference` | `<sup id="fnref-name" class="footnote-ref"><a href="#fn-name">[name]</a></sup>`. The second reference to the same footnote has the id `fnref-name-2` |
| `footnote_definition` | `<div id="fn-name" class="footnote">`, with the label `<a href="#fnref-name" class="footnote-label">[name]:</a>` in its first paragraph |
| `alert` | `<blockquote class="alert alert-note"><p class="alert-title">Note</p>…</blockquote>` |
| `subtext` | `<p><sub>…</sub></p>` |
| `math` | `<span class="math">…</span>` |
| `spoilered_text` | `<span class="spoiler">…</span>` |
| `code_block` | `<pre><code class="language-rust">`. No class for the info `text` |
| `table` | `<table>` with `<thead>` and `<tbody>`. A cell has `align` when its column has an alignment |
| `task_item` | `<li>` with a disabled checkbox |

An inline footnote (`^[text]`) has a name that the parser made, such as `__inline_1`. Its number is shown instead: `[1]`.

`html_block` and `html_inline` are written into a `<span>` as raw HTML. Render only content that you trust.

## Build

```bash
npm install
npm run build   # outputs dist/ with ESM, CJS, and .d.ts
npm test        # runs vitest
```

## License

MIT
