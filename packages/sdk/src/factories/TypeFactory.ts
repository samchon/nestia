import { type KeywordTypeNode, SyntaxKind, factory } from "@ttsc/factory";

/**
 * Higher-level type-keyword factory.
 *
 * Wraps {@link factory.createKeywordTypeNode} with a name-based interface so
 * generator code reads as `TypeFactory.keyword("any")` instead of selecting the
 * `SyntaxKind.AnyKeyword` token by hand.
 *
 * @evidence contracts/common.md#principled-implementation The namespace maps names to the keyword syntax kinds.
 * @evidence contracts/common.md#clear-and-simple-design One table, one type, and one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation TypeFactory constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
   * @evidence contracts/common.md#principled-implementation The type is the key set of the table, so a keyword is one table entry.
   * @evidence contracts/common.md#clear-and-simple-design One derived type.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the set.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation TypeFactory.Keyword constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export type Keyword = keyof typeof KEYWORDS;

  /**
   * Builds the keyword type node of a name.
   *
   * @evidence contracts/common.md#principled-implementation The name is looked up in the table.
   * @evidence contracts/common.md#clear-and-simple-design One lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states its input.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation TypeFactory.keyword constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const keyword = (type: Keyword): KeywordTypeNode =>
    factory.createKeywordTypeNode(KEYWORDS[type]);
}
