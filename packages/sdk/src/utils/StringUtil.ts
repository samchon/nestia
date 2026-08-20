export namespace StringUtil {
  export const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

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
   */
  export const isAnonymous = (str: string): boolean =>
    str === "__type" ||
    str === "__object" ||
    str.startsWith("__type.") ||
    str.startsWith("__object.") ||
    str.startsWith("__type-") ||
    str.startsWith("__object-");

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
   */
  export const accessorsOf = (name: string): string[] => {
    const duplicated: RegExpMatchArray | null = name.match(/^(.+)-o(\d+)$/);
    return duplicated === null
      ? name.split(".")
      : [...duplicated[1]!.split("."), `o${duplicated[2]!}`];
  };
}
