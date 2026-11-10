import { memo, createElement, useMemo } from 'react';
import type { AstNode } from 'flatmarkdown-ast';
import type { RenderContext } from './types';
import { extractText, footnoteLabel } from './utils';

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
function renderItemChildren(children: AstNode[], context: RenderContext, tight: boolean) {
  return children.map((child, i) => (
    <FmNode
      key={i}
      node={child}
      context={{ ...context, tightList: tight && child.type === 'paragraph' }}
    />
  ));
}

function FmNodeInner({ node, context }: FmNodeProps) {
  const children = useMemo(
    () => ('children' in node && node.children ? (node.children as AstNode[]) : []),
    [node],
  );

  const n = node as unknown as Record<string, unknown>;

  function childContext(overrides: Partial<RenderContext>): RenderContext {
    return { ...context, ...overrides };
  }

  switch (node.type) {
    // ── Block Nodes ──

    case 'document':
      return <>{renderChildren(children, context)}</>;

    case 'paragraph':
      if (context.tightList) {
        return <>{renderChildren(children, context)}</>;
      }
      return <p>{renderChildren(children, context)}</p>;

    case 'heading': {
      const level = n.level as number;
      return createElement(`h${level}`, null, ...renderChildren(children, context));
    }

    case 'code_block': {
      const info = n.info as string | undefined;
      const className = info ? `language-${info}` : undefined;
      return (
        <pre>
          <code className={className}>{n.literal as string}</code>
        </pre>
      );
    }

    case 'block_quote':
    case 'multiline_block_quote':
      return <blockquote>{renderChildren(children, context)}</blockquote>;

    case 'list': {
      const isOrdered = n.list_type === 'ordered';
      const start = n.start as number | null;
      const listContext = childContext({ inTightList: n.tight as boolean });
      if (isOrdered) {
        return (
          <ol start={start != null && start !== 1 ? start : undefined}>
            {renderChildren(children, listContext)}
          </ol>
        );
      }
      return <ul>{renderChildren(children, listContext)}</ul>;
    }

    case 'item':
      return <li>{renderItemChildren(children, context, context.inTightList)}</li>;

    case 'task_item':
      return (
        <li>
          <input type="checkbox" checked={n.symbol != null} disabled readOnly />
          {renderItemChildren(children, context, true)}
        </li>
      );

    case 'table':
      return (
        <table>
          {renderChildren(children, childContext({ tableAlignments: n.alignments as string[] }))}
        </table>
      );

    case 'table_row':
      return (
        <tr>
          {children.map((child, i) => (
            <FmNode
              key={i}
              node={child}
              context={childContext({ inHeaderRow: n.header as boolean, cellIndex: i })}
            />
          ))}
        </tr>
      );

    case 'table_cell': {
      const alignment = context.tableAlignments[context.cellIndex];
      const align = (alignment && alignment !== 'none' ? alignment : undefined) as 'left' | 'center' | 'right' | undefined;
      if (context.inHeaderRow) {
        return <th align={align}>{renderChildren(children, context)}</th>;
      }
      return <td align={align}>{renderChildren(children, context)}</td>;
    }

    case 'thematic_break':
      return <hr />;

    case 'html_block':
      return <span dangerouslySetInnerHTML={{ __html: n.literal as string }} />;

    case 'footnote_definition':
      return (
        <div className="footnote" id={`fn-${n.name}`}>
          {renderChildren(children, context)}
        </div>
      );

    case 'alert':
      return (
        <div className={`alert alert-${n.alert_type}`}>
          {renderChildren(children, context)}
        </div>
      );

    case 'subtext':
      return <>{renderChildren(children, context)}</>;

    // ── Inline Nodes ──

    case 'text':
      return <>{n.value as string}</>;

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
      return <code>{n.literal as string}</code>;

    case 'link':
      return (
        <a href={n.url as string} title={(n.title as string) || undefined}>
          {renderChildren(children, context)}
        </a>
      );

    case 'embed': {
      const alt = extractText(node);
      return (
        <img
          src={n.url as string}
          alt={alt}
          title={(n.title as string) || undefined}
        />
      );
    }

    case 'wikilink': {
      const prefix = context.options.wikilink?.hrefPrefix ?? '';
      const href = prefix + (n.url as string);
      const cssClass = context.options.wikilink?.cssClass || undefined;
      const LinkComp = context.options.wikilink?.linkComponent;
      if (LinkComp) {
        return (
          <LinkComp to={href} className={cssClass ?? null} data-wikilink="true">
            {renderChildren(children, context)}
          </LinkComp>
        );
      }
      return (
        <a href={href} className={cssClass} data-wikilink="true">
          {renderChildren(children, context)}
        </a>
      );
    }

    case 'hashtag': {
      const prefix = context.options.wikilink?.hrefPrefix ?? '';
      const href = prefix + (n.value as string);
      const label = `#${n.value as string}`;
      const LinkComp = context.options.wikilink?.linkComponent;
      if (LinkComp) {
        return (
          <LinkComp to={href} className="hashtag">
            {label}
          </LinkComp>
        );
      }
      return (
        <a href={href} className="hashtag">
          {label}
        </a>
      );
    }

    case 'footnote_reference': {
      const name = n.name as string;
      const refNum = n.ref_num as number;
      // The first reference has no number, so that the label of the definition links to it.
      const id = refNum === 1 ? `fnref-${name}` : `fnref-${name}-${refNum}`;
      return (
        <sup id={id} className="footnote-ref">
          <a href={`#fn-${name}`}>{`[${footnoteLabel(name)}]`}</a>
        </sup>
      );
    }

    case 'shortcode':
      return <>{n.emoji as string}</>;

    case 'math':
      if (n.display_math) {
        return (
          <pre>
            <code className="math math-display">{n.literal as string}</code>
          </pre>
        );
      }
      return <code className="math math-inline">{n.literal as string}</code>;

    case 'html_inline':
      return <span dangerouslySetInnerHTML={{ __html: n.value as string }} />;

    default:
      return null;
  }
}

export const FmNode = memo(FmNodeInner);
