import { type KeywordTypeNode, SyntaxKind, factory } from "@ttsc/factory";

/**
 * Keyword type-node helper, mirroring `@typia/core`'s `TypeFactory.keyword`,
 * but built on `@ttsc/factory` so no `typescript` runtime is bundled.
 */
export namespace TypeFactory {
  export const keyword = (
    type:
      | "void"
      | "any"
      | "unknown"
      | "boolean"
      | "number"
      | "bigint"
      | "string",
  ): KeywordTypeNode =>
    factory.createKeywordTypeNode(
      type === "void"
        ? SyntaxKind.VoidKeyword
        : type === "any"
          ? SyntaxKind.AnyKeyword
          : type === "unknown"
            ? SyntaxKind.UnknownKeyword
            : type === "boolean"
              ? SyntaxKind.BooleanKeyword
              : type === "number"
                ? SyntaxKind.NumberKeyword
                : type === "bigint"
                  ? SyntaxKind.BigIntKeyword
                  : SyntaxKind.StringKeyword,
    );
}
