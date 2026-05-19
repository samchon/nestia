import { SyntaxKind } from "../constants/SyntaxKind";
import { createNumericLiteral } from "../factory/literals/createNumericLiteral";
import { createPrefixUnaryExpression } from "../factory/expressions/createPrefixUnaryExpression";
import type { Node } from "../structures/Node";

/**
 * Numeric-literal helper that handles negative values via a leading
 * `MinusToken` prefix unary, matching how the TypeScript factory itself
 * emits negative numeric literals. Replaces the legacy `@typia/core`
 * `ExpressionFactory.number` nestia previously imported.
 */
export namespace ExpressionFactory {
  export const number = (value: number): Node =>
    value < 0
      ? createPrefixUnaryExpression(
          SyntaxKind.MinusToken,
          createNumericLiteral(Math.abs(value)),
        )
      : createNumericLiteral(value);
}
