import { type KeywordTypeNode, SyntaxKind, factory } from "@ttsc/factory";

/**
 * Higher-level type-keyword factory.
 *
 * Wraps {@link factory.createKeywordTypeNode} with a name-based interface so
 * generator code reads as `TypeFactory.keyword("any")` instead of selecting the
 * `SyntaxKind.AnyKeyword` token by hand.
 *
 * @evidence contracts/common.md#principled-implementation The namespace maps the names of the nine keyword types to their syntax kinds.
 * @evidence contracts/common.md#clear-and-simple-design One table, one type, and one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
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

  /**
   * The names of the supported keyword types.
   *
   * @evidence contracts/common.md#principled-implementation The type is the key set of the table that maps names to syntax kinds, so a new keyword is one table entry.
   * @evidence contracts/common.md#clear-and-simple-design One derived type.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the set.
   */
  export type Keyword = keyof typeof KEYWORDS;

  /**
   * Builds the keyword type node of a keyword name.
   *
   * @evidence contracts/common.md#principled-implementation The name is looked up in the table, so an unsupported name is a compile error.
   * @evidence contracts/common.md#clear-and-simple-design One lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the type grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states its input.
   */
  export const keyword = (type: Keyword): KeywordTypeNode =>
    factory.createKeywordTypeNode(KEYWORDS[type]);
}
