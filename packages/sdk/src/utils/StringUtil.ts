/**
 * String helpers of the SDK generator.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds capitalization, duplicate escaping, and the recognition of anonymous type names.
 * @evidence contracts/common.md#clear-and-simple-design Five small functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The markers are the spellings typia uses for anonymous types.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace StringUtil {
  /**
   * Upper-cases the first character and lower-cases the rest.
   *
   * @evidence contracts/common.md#principled-implementation The first character is transformed alone and the rest is lower-cased.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It applies to every input.
   * @evidence contracts/common.md#meaningful-documentation The comment states the rule.
   */
  export const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  /**
   * Returns the name with underscores prefixed until it is not in the list of
   * names to keep clear of.
   *
   * @evidence contracts/common.md#principled-implementation The recursion adds one underscore at a time, so the result is the shortest such name.
   * @evidence contracts/common.md#clear-and-simple-design One curried function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is generic.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const escapeDuplicate =
    (keep: string[]) =>
    (change: string): string =>
      keep.includes(change) ? escapeDuplicate(keep)(`_${change}`) : change;

  /**
   * The marker names typia gives a type that has no identity of its own: an
   * anonymous object literal, and the same literal after a duplicate id was
   * minted for it.
   *
   * One definition because the spellings drift. typia qualifies with `.` and
   * disambiguates a duplicate with `-o<counter>`, so the same anonymous type
   * reads `__type`, `__type.o1` or `__type-o1` depending on the release and on
   * whether its name collided. Three call sites carried their own copy of this
   * list, only one of them learned the `-` spelling, and the two that did not
   * declared and referenced modules that do not exist.
   *
   * @evidence contracts/common.md#principled-implementation The names `__type` and `__object` and their dotted or dashed forms are the anonymous markers, so the predicate is a list of those spellings.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is the shared definition that the generators use.
   * @evidence contracts/common.md#meaningful-documentation The comment states the markers.
   */
  export const isAnonymous = (str: string): boolean =>
    str === "__type" ||
    str === "__object" ||
    str.startsWith("__type.") ||
    str.startsWith("__object.") ||
    str.startsWith("__type-") ||
    str.startsWith("__object-");

  /**
   * Reports whether a type name is implicit: the name `object`, an anonymous
   * name, or a readonly tuple.
   *
   * @evidence contracts/common.md#principled-implementation It extends the anonymous test with the two other names that cannot be referenced.
   * @evidence contracts/common.md#clear-and-simple-design One expression over `isAnonymous`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It shares the anonymous list.
   * @evidence contracts/common.md#meaningful-documentation The comment states the cases.
   */
  export const isImplicit = (str: string) =>
    str === "object" || isAnonymous(str) || str.includes("readonly [");

  /**
   * Split a typia metadata name into the accessor path a generated SDK declares
   * it under.
   *
   * Typia separates a qualified name with `.` and a _duplicated_ name from its
   * disambiguating counter with a trailing `-o<counter>`
   * (`MetadataCollection.composeName`). Those are different relations and only
   * the first is a namespace boundary -- which is exactly why typia stopped
   * spelling the second one with a dot, where the two were indistinguishable.
   *
   * A duplicate still has to become some declarable identifier, and the counter
   * is rendered as the last accessor: `IDirectory-o1` declares as `namespace
   * IDirectory { type o1 }`, byte-identical to what the previous
   * `IDirectory.o1` spelling produced. Reading the marker here rather than
   * guessing at the name is what the new separator makes possible -- `-` cannot
   * occur in a qualified name, so unlike the old spelling this cannot be
   * confused with one.
   *
   * @evidence contracts/common.md#principled-implementation The marker is matched at the end of the name, and the rest is split on dots.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The marker is the spelling typia uses for duplicate names.
   * @evidence contracts/common.md#meaningful-documentation The comment states the marker rule.
   */
  export const accessorsOf = (name: string): string[] => {
    const duplicated: RegExpMatchArray | null = name.match(/^(.+)-o(\d+)$/);
    return duplicated === null
      ? name.split(".")
      : [...duplicated[1]!.split("."), `o${duplicated[2]!}`];
  };
}
