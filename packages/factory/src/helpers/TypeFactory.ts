import { SyntaxKind } from "../constants/SyntaxKind";
import { createKeywordTypeNode } from "../factory/types/createKeywordTypeNode";
import type { Node } from "../structures/Node";

/**
 * Higher-level type-keyword factory.
 *
 * Wraps {@link createKeywordTypeNode} with a name-based interface so generator
 * code reads as `TypeFactory.keyword("any")` instead of selecting the
 * `SyntaxKind.AnyKeyword` token by hand. Mirrors the legacy `@typia/core`
 * `TypeFactory` namespace nestia previously depended on.
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

  export const keyword = (type: Keyword): Node =>
    createKeywordTypeNode(KEYWORDS[type]);
}
