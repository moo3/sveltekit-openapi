import { Node, SyntaxKind } from 'ts-morph';
import type { ParamInfo } from '../types.js';

/**
 * Extract path parameters from `const { param } = event.params` destructuring.
 *
 * Also accepts params accessed via `event.params.paramName`.
 */
export function analyzeRouteParams(body: Node, knownPathParams: string[]): ParamInfo[] {
  const found = new Set<string>();

  body.forEachDescendant((node) => {
    // Pattern: const { x, y } = event.params
    if (Node.isVariableDeclaration(node)) {
      const nameNode = node.getNameNode();
      if (Node.isObjectBindingPattern(nameNode)) {
        const init = node.getInitializer();
        if (init && init.getText().includes('event.params') || init?.getText().includes('.params')) {
          for (const element of nameNode.getElements()) {
            const name = element.getName();
            found.add(name);
          }
        }
      }
    }

    // Pattern: event.params.paramName
    if (Node.isPropertyAccessExpression(node)) {
      const expr = node.getExpression();
      if (expr.getText() === 'event.params' || expr.getText() === 'params') {
        found.add(node.getName());
      }
    }
  });

  // Also include known path params from the filesystem scan
  for (const p of knownPathParams) {
    found.add(p);
  }

  return Array.from(found).map((name) => ({
    name,
    in: 'path' as const,
    required: true,
    type: 'string',
  }));
}
