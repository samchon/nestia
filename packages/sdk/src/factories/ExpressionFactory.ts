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
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the number literal builder.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace ExpressionFactory {
  /**
   * Builds a numeric literal, with a prefix minus for a negative value.
   *
   * @evidence contracts/common.md#principled-implementation A negative literal is a prefix unary minus on a positive literal in the syntax tree, so the builder produces that shape.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states the negative case.
   */
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
