import {
  type NumericLiteral,
  type PrefixUnaryExpression,
  SyntaxKind,
  factory,
} from "@ttsc/factory";

/**
 * Numeric-literal helper that handles negative values via a leading
 * `MinusToken` prefix unary, matching how the TypeScript factory itself emits
 * negative numeric literals.
 */
export namespace ExpressionFactory {
  export const number = (
    value: number,
  ): NumericLiteral | PrefixUnaryExpression =>
    value < 0
      ? factory.createPrefixUnaryExpression(
          SyntaxKind.MinusToken,
          factory.createNumericLiteral(Math.abs(value)),
        )
      : factory.createNumericLiteral(value);
}
