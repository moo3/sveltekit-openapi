import { Node, SyntaxKind } from 'ts-morph';
import type { RequestBodyInfo } from '../types.js';

/**
 * Detect request body usage from `event.request.json()` calls.
 *
 * Patterns detected:
 *   const { a, b } = await event.request.json()  → fields: [a, b]
 *   const body = await event.request.json()       → generic object
 *   schema.parse(body)                            → links to schema (tier 2)
 */
export function analyzeRequestBody(body: Node): RequestBodyInfo | undefined {
  let hasRequestJson = false;
  let fields: Array<{ name: string; type: string; required: boolean }> = [];
  let schemaRef: string | undefined;

  body.forEachDescendant((node) => {
    // Find event.request.json() calls
    if (Node.isCallExpression(node)) {
      const text = node.getExpression().getText();
      if (text.includes('request.json')) {
        hasRequestJson = true;

        // Check if the result is destructured
        // Walk up to find the variable declaration
        const parent = node.getParent();
        // await event.request.json()
        const awaitExpr = parent && Node.isAwaitExpression(parent) ? parent : null;
        const declParent = awaitExpr?.getParent() || parent?.getParent();

        if (declParent && Node.isVariableDeclaration(declParent)) {
          const nameNode = declParent.getNameNode();
          if (Node.isObjectBindingPattern(nameNode)) {
            fields = nameNode.getElements().map((el) => ({
              name: el.getName(),
              type: 'string',
              required: true,
            }));
          }
        }
      }

      // Check for schema.parse(body) or schema.safeParse(body) patterns
      const exprText = node.getExpression().getText();
      if (exprText.endsWith('.parse') || exprText.endsWith('.safeParse')) {
        const schemaName = exprText.replace(/\.(safe)?[Pp]arse$/, '');
        // Only capture simple identifiers (e.g. registerSchema, not complex expressions)
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaName)) {
          schemaRef = schemaName;
        }
      }
    }
  });

  if (!hasRequestJson) return undefined;

  return {
    required: true,
    fields,
    schemaRef,
  };
}
