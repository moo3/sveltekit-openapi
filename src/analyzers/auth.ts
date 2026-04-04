import { Node, SyntaxKind } from 'ts-morph';
import type { SecurityInfo } from '../types.js';

const DEFAULT_AUTH_PATTERNS = ['requireAuth', 'requireRole'];

/**
 * Detect authentication/authorization calls in a handler body.
 *
 * Looks for:
 *   requireAuth(event)         → { type: 'auth' }
 *   requireRole(event, 'admin') → { type: 'role', roles: ['admin'] }
 */
export function analyzeAuth(body: Node, authPatterns?: string[]): SecurityInfo[] {
  const patterns = authPatterns || DEFAULT_AUTH_PATTERNS;
  const security: SecurityInfo[] = [];
  const seen = new Set<string>();

  body.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    const fnName = expr.getText();

    if (!patterns.includes(fnName)) return;
    if (seen.has(fnName)) return;
    seen.add(fnName);

    if (fnName === 'requireRole' || fnName.toLowerCase().includes('role')) {
      // Extract role string arguments (skip first arg which is event)
      const args = node.getArguments();
      const roles: string[] = [];
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (Node.isStringLiteral(arg)) {
          roles.push(arg.getLiteralValue());
        }
      }
      security.push({ type: 'role', roles });
    } else {
      security.push({ type: 'auth' });
    }
  });

  return security;
}
