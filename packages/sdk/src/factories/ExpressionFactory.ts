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
 *
 * Infinity is written `1e999`, the literal that evaluates to it and the only
 * spelling that is also a literal type; `Infinity` names a value, not a type.
 */
export namespace ExpressionFactory {
  export const number = (
    value: number,
  ): NumericLiteral | PrefixUnaryExpression =>
    value < 0
      ? factory.createPrefixUnaryExpression(
          SyntaxKind.MinusToken,
          literal(-value),
        )
      : literal(value);

  const literal = (value: number): NumericLiteral =>
    factory.createNumericLiteral(value === Infinity ? "1e999" : value);
}
