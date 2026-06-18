import { type KeywordTypeNode, SyntaxKind, factory } from "@ttsc/factory";

/**
 * Higher-level type-keyword factory.
 *
 * Wraps {@link factory.createKeywordTypeNode} with a name-based interface so
 * generator code reads as `TypeFactory.keyword("any")` instead of selecting the
 * `SyntaxKind.AnyKeyword` token by hand.
 */
export namespace TypeFactory {
  const KEYWORDS = {
    void: SyntaxKind.VoidKeyword,
    any: SyntaxKind.AnyKeyword,
    unknown: SyntaxKind.UnknownKeyword,
    boolean: SyntaxKind.BooleanKeyword,
    number: SyntaxKind.NumberKeyword,
    bigint: SyntaxKind.BigIntKeyword,
    string: SyntaxKind.StringKeyword,
    never: SyntaxKind.NeverKeyword,
    undefined: SyntaxKind.UndefinedKeyword,
  } as const;

  export type Keyword = keyof typeof KEYWORDS;

  export const keyword = (type: Keyword): KeywordTypeNode =>
    factory.createKeywordTypeNode(KEYWORDS[type]);
}
