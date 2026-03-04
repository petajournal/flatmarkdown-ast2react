import { memo, useMemo } from 'react';
import type { AstNode } from 'flatmarkdown-ast';
import type { ReactRenderOptions, RenderContext } from './types';
import { defaultContext } from './types';
import { FmNode } from './fm-node';

interface FmRootProps {
  ast: AstNode | string;
  options?: ReactRenderOptions;
}

function FmRootInner({ ast, options = {} }: FmRootProps) {
  const rootNode = useMemo<AstNode | null>(() => {
    if (!ast) return null;
    return typeof ast === 'string' ? JSON.parse(ast) : ast;
  }, [ast]);

  const rootContext = useMemo<RenderContext>(() => defaultContext(options), [options]);

  if (!rootNode) return null;

  return <FmNode node={rootNode} context={rootContext} />;
}

export const FmRoot = memo(FmRootInner);
