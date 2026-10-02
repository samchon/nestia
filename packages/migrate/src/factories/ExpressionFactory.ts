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
 * @evidence contracts/common.md#principled-implementation The namespace holds the number literal builder that the generators need.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace ExpressionFactory {
  /**
   * Builds a numeric literal, using a prefix minus for a negative value,
   * because a negative numeric literal is not a valid node.
   *
   * @evidence contracts/common.md#principled-implementation TypeScript represents a negative number as a prefix unary minus applied to a positive literal, so the function builds that shape for values below zero and a plain literal otherwise.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the syntax tree grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states the negative case.
   */
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
