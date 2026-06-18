import {
  type CallExpression,
  type NumericLiteral,
  type PrefixUnaryExpression,
  SyntaxKind,
  factory,
} from "@ttsc/factory";

/**
 * Expression helpers, mirroring `@typia/core`'s `ExpressionFactory`, built on
 * `@ttsc/factory` so no `typescript` runtime is bundled.
 */
export namespace ExpressionFactory {
  export const number = (
    value: number,
  ): PrefixUnaryExpression | NumericLiteral =>
    value < 0
      ? factory.createPrefixUnaryExpression(
          SyntaxKind.MinusToken,
          factory.createNumericLiteral(Math.abs(value)),
        )
      : factory.createNumericLiteral(value);

  export const bigint = (value: number | bigint): CallExpression =>
    factory.createCallExpression(
      factory.createIdentifier("BigInt"),
      undefined,
      [factory.createIdentifier(value.toString())],
    );
}
