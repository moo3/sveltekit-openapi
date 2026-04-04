import { Node, SyntaxKind } from 'ts-morph';
import type { ParamInfo } from '../types.js';

/**
 * Extract query parameters from `event.url.searchParams.get('name')` calls.
 *
 * All query params are optional and typed as string.
 */
export function analyzeQueryParams(body: Node): ParamInfo[] {
  const params: ParamInfo[] = [];
  const seen = new Set<string>();

  body.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    const text = expr.getText();

    // Match event.url.searchParams.get('name') or url.searchParams.get('name')
    if (!text.includes('searchParams.get')) return;

    const args = node.getArguments();
    if (args.length === 0) return;

    const firstArg = args[0];
    if (!Node.isStringLiteral(firstArg)) return;

    const name = firstArg.getLiteralValue();
    if (seen.has(name)) return;
    seen.add(name);

    params.push({
      name,
      in: 'query',
      required: false,
      type: 'string',
    });
  });

  return params;
}
