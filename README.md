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

## Supported AST Node Types

46 node types total, matching the `flatmarkdown` Rust crate output.

**Block (23):** `document`, `paragraph`, `heading`, `code_block`, `block_quote`, `multiline_block_quote`, `list`, `item`, `task_item`, `table`, `table_row`, `table_cell`, `thematic_break`, `html_block`, `footnote_definition`, `description_list`, `description_item`, `description_term`, `description_details`, `alert`, `front_matter`, `heex_block`, `subtext`

**Inline (23):** `text`, `softbreak`, `linebreak`, `emph`, `strong`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript`, `spoilered_text`, `code`, `link`, `image`, `footnote_reference`, `shortcode`, `math`, `html_inline`, `heex_inline`, `raw`, `escaped`, `escaped_tag`, `wikilink`

## Build

```bash
npm install
npm run build   # outputs dist/ with ESM, CJS, and .d.ts
npm test        # runs vitest
```

## License

MIT
