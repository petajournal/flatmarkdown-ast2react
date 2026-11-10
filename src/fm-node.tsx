import { memo, createElement } from 'react';
import type { ReactNode } from 'react';
import type { AlertNode, AstNode } from 'flatmarkdown-ast';
import type { RenderContext } from './types';
import { extractText, footnoteLabel } from './utils';

const ALERT_TITLES: Record<AlertNode['alert_type'], string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

interface FmNodeProps {
  node: AstNode;
  context: RenderContext;
}

function renderChildren(children: AstNode[], context: RenderContext) {
  return children.map((child, i) => (
    <FmNode key={i} node={child} context={context} />
  ));
}

// Renders the children of a list item. Only a paragraph that is a direct child
// loses its <p>; a paragraph deeper (in a block quote, for example) keeps it.
function renderItemChildren(children: AstNode[], context: RenderContext) {
  return children.map((child, i) => (
    <FmNode
      key={i}
      node={child}
      context={{ ...context, tightList: context.inTightList && child.type === 'paragraph' }}
    />
  ));
}

function isHeaderRow(row: AstNode) {
  return row.type === 'table_row' && row.header;
}

interface PageLinkProps {
  /** The link target, with the prefix of the options */
  href: string;
  className?: string;
  /** true for a wikilink; a hashtag is told apart by its class */
  wikilink?: boolean;
  context: RenderContext;
  children: ReactNode;
}

// A link to a page: a wikilink or a hashtag. Both use the wikilink options, because a
// hashtag has the same meaning as a wikilink to the page of the tag.
function PageLink({ href, className, wikilink = false, context, children }: PageLinkProps) {
  const options = context.options.wikilink;
  const marker = wikilink ? { 'data-wikilink': 'true' } : { 'data-hashtag': 'true' };
  const LinkComp = options?.linkComponent;
  if (LinkComp) {
    return (
      <LinkComp to={href} className={className ?? null} {...marker}>
        {children}
      </LinkComp>
    );
  }
  return (
    <a href={href} className={className} {...marker}>
      {children}
    </a>
  );
}

function FmNodeInner({ node, context }: FmNodeProps) {
  const children: AstNode[] = ('children' in node && node.children) || [];

  switch (node.type) {
    // ── Block Nodes ──

    case 'document':
      return <>{renderChildren(children, context)}</>;

    case 'paragraph':
      if (context.tightList) {
        return <>{renderChildren(children, context)}</>;
      }
      return <p>{renderChildren(children, context)}</p>;

    case 'heading':
      return createElement(`h${node.level}`, null, ...renderChildren(children, context));

    case 'code_block': {
      // "text" is the info of a fenced block without a language. It is not a language.
      const className = node.info && node.info !== 'text' ? `language-${node.info}` : undefined;
      return (
        <pre>
          <code className={className}>{node.literal}</code>
        </pre>
      );
    }

    case 'block_quote':
    case 'multiline_block_quote':
      return <blockquote>{renderChildren(children, context)}</blockquote>;

    case 'list': {
      const listContext = { ...context, inTightList: node.tight };
      if (node.list_type === 'ordered') {
        return (
          <ol start={node.start !== 1 ? node.start : undefined}>
            {renderChildren(children, listContext)}
          </ol>
        );
      }
      return <ul>{renderChildren(children, listContext)}</ul>;
    }

    case 'item':
      return <li>{renderItemChildren(children, context)}</li>;

    case 'task_item':
      return (
        <li>
          <input type="checkbox" checked={node.symbol != null} disabled readOnly />
          {renderItemChildren(children, context)}
        </li>
      );

    case 'table': {
      const tableContext = { ...context, tableAlignments: node.alignments };
      const headerRows = children.filter(isHeaderRow);
      const bodyRows = children.filter(row => !isHeaderRow(row));
      return (
        <table>
          {headerRows.length > 0 && <thead>{renderChildren(headerRows, tableContext)}</thead>}
          {bodyRows.length > 0 && <tbody>{renderChildren(bodyRows, tableContext)}</tbody>}
        </table>
      );
    }

    case 'table_row':
      return (
        <tr>
          {children.map((child, i) => (
            <FmNode
              key={i}
              node={child}
              context={{ ...context, inHeaderRow: node.header, cellIndex: i }}
            />
          ))}
        </tr>
      );

    case 'table_cell': {
      const alignment = context.tableAlignments[context.cellIndex];
      const align = alignment && alignment !== 'none' ? alignment : undefined;
      if (context.inHeaderRow) {
        return <th align={align}>{renderChildren(children, context)}</th>;
      }
      return <td align={align}>{renderChildren(children, context)}</td>;
    }

    case 'thematic_break':
      return <hr />;

    case 'html_block':
      return <span dangerouslySetInnerHTML={{ __html: node.literal }} />;

    case 'footnote_definition': {
      const label = (
        <a href={`#fnref-${node.name}`} className="footnote-label">{`[${footnoteLabel(node.name)}]:`}</a>
      );
      const [first, ...rest] = children;
      // The label goes inside the first paragraph, so that the body continues on the same
      // line without any CSS. A definition that starts with another block keeps the label
      // in front of it.
      if (first?.type === 'paragraph') {
        return (
          <div className="footnote" id={`fn-${node.name}`}>
            <p>
              {label} {renderChildren(first.children ?? [], context)}
            </p>
            {renderChildren(rest, context)}
          </div>
        );
      }
      return (
        <div className="footnote" id={`fn-${node.name}`}>
          {label}
          {renderChildren(children, context)}
        </div>
      );
    }

    case 'alert':
      return (
        <blockquote className={`alert alert-${node.alert_type}`}>
          <p className="alert-title">{node.title ?? ALERT_TITLES[node.alert_type]}</p>
          {renderChildren(children, context)}
        </blockquote>
      );

    case 'subtext':
      return (
        <p>
          <sub>{renderChildren(children, context)}</sub>
        </p>
      );

    // ── Inline Nodes ──

    case 'text':
      return <>{node.value}</>;

    case 'softbreak':
      return <>{'\n'}</>;

    case 'linebreak':
      return <br />;

    case 'emph':
      return <em>{renderChildren(children, context)}</em>;

    case 'strong':
      return <strong>{renderChildren(children, context)}</strong>;

    case 'strikethrough':
      return <del>{renderChildren(children, context)}</del>;

    case 'underline':
      return <u>{renderChildren(children, context)}</u>;

    case 'highlight':
      return <mark>{renderChildren(children, context)}</mark>;

    case 'superscript':
      return <sup>{renderChildren(children, context)}</sup>;

    case 'subscript':
      return <sub>{renderChildren(children, context)}</sub>;

    case 'spoilered_text':
      return <span className="spoiler">{renderChildren(children, context)}</span>;

    case 'code':
      return <code>{node.literal}</code>;

    case 'link':
      return (
        <a href={node.url} title={node.title || undefined}>
          {renderChildren(children, context)}
        </a>
      );

    case 'embed': {
      const baseUrl = context.options.embed?.baseUrl;
      const src = baseUrl ? new URL(node.url, baseUrl).href : node.url;
      return <img src={src} alt={extractText(node)} title={node.title || undefined} />;
    }

    case 'wikilink':
      return (
        <PageLink
          href={(context.options.wikilink?.hrefPrefix ?? '') + node.url}
          className={context.options.wikilink?.cssClass || undefined}
          wikilink
          context={context}
        >
          {renderChildren(children, context)}
        </PageLink>
      );

    case 'hashtag': {
      // A tag page can live in its own folder, so a hashtag has its own prefix. Without one,
      // it links where a wikilink to a page of that name links.
      const prefix =
        context.options.hashtag?.hrefPrefix ?? context.options.wikilink?.hrefPrefix ?? '';
      return (
        <PageLink
          href={prefix + node.value}
          className={context.options.hashtag?.cssClass ?? 'hashtag'}
          context={context}
        >
          {`#${node.value}`}
        </PageLink>
      );
    }

    case 'footnote_reference': {
      // The first reference has no number, so that the label of the definition links to it.
      const id = node.ref_num === 1 ? `fnref-${node.name}` : `fnref-${node.name}-${node.ref_num}`;
      return (
        <sup id={id} className="footnote-ref">
          <a href={`#fn-${node.name}`}>{`[${footnoteLabel(node.name)}]`}</a>
        </sup>
      );
    }

    case 'shortcode':
      return <>{node.emoji}</>;

    case 'math':
      return <span className="math">{node.literal}</span>;

    case 'html_inline':
      return <span dangerouslySetInnerHTML={{ __html: node.value }} />;

    default:
      // A node of a newer parser. Its children are rendered, so that the text inside is not lost.
      return <>{renderChildren(children, context)}</>;
  }
}

export const FmNode = memo(FmNodeInner);
