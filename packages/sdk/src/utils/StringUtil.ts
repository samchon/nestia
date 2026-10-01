/**
 * String helpers of the SDK generator.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds capitalization, duplicate escaping, and the recognition of anonymous type names.
 * @evidence contracts/common.md#clear-and-simple-design Five small functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The markers are the spellings typia uses for anonymous types.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups string operations; each function owns its scan or duplicate lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no shared computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no input-dependent retained state or handles.
 */
export namespace StringUtil {
  /**
   * Upper-cases the first character and lower-cases the rest.
   *
   * @evidence contracts/common.md#principled-implementation The first character is transformed alone and the rest is lower-cased.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It applies to every input.
   * @evidence contracts/common.md#meaningful-documentation The comment states the rule.
   * @evidence contracts/performance.md#efficient-algorithms Case conversion and copying process the input characters once with proportional returned string storage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Case conversion coordinates no shared requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned string belongs to the caller; this operation retains no state or handles.
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
   * @evidence contracts/performance.md#efficient-algorithms Each occupied candidate scans the supplied keep list and adds one underscore; the number of recursive candidates is bounded by distinct occupied spellings in that list, with string comparison and copying costs proportional to candidate lengths.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller supplies the current keep list; this operation coordinates no shared computation between calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The closure retains only the caller's keep list for its own lifetime and owns no history, handles or tasks.
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
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of equalities and constant-length prefix checks inspect each name without graph traversal or input-dependent state.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate coordinates no shared computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This predicate retains no input or handles.
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
   * @evidence contracts/performance.md#efficient-algorithms Fixed name checks and one substring search take at most linear time in the name's length, without allocating a graph or cache.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate coordinates no shared computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This predicate retains no input or handles.
   */
  export const isImplicit = (str: string) =>
    str === "object" || isAnonymous(str) || str.includes("readonly [");

  /**
   * Splits a metadata name into legal TypeScript declaration accessors.
   *
   * Component keys remain unchanged: this conversion owns only the cloned
   * declaration, reference and import spelling. Identifier code points survive;
   * other code points are written as hexadecimal identifier fragments. Reserved
   * binding and intrinsic type names receive an underscore. The route
   * dictionary compares these same accessors when separating unequal component
   * definitions, including a source name which already contains an escaped
   * fragment.
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
   * @evidence contracts/common.md#principled-implementation The historical trailing duplicate marker and namespace dots are interpreted before each segment is encoded under Unicode IdentifierStart/IdentifierPart and strict binding/type-name restrictions. All clone declarations, references, imports and collision slots consume this same spelling; raw metadata component keys are not rewritten.
   * @evidence contracts/common.md#clear-and-simple-design One accessor operation delegates segment encoding to a private helper with language-defined reserved names.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoding depends on identifier grammar, not a DTO or consumer name; the existing semantic collision partition separates unequal definitions whose accessors coincide.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes raw component keys from TypeScript accessors and explains Unicode encoding, reserved bindings and duplicate compatibility.
   * @evidence contracts/performance.md#efficient-algorithms Each name and its code points are scanned once, with output space proportional to the encoded spelling; reserved-name lookup uses a fixed set.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure conversion coordinates no completed or in-flight work across consumers; its callers own graph and dictionary reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fixed grammar set has no input-dependent history; temporary accessor strings belong to the caller and no handles or tasks are retained.
   */
  export const accessorsOf = (name: string): string[] => {
    const duplicated: RegExpMatchArray | null = name.match(/^(.+)-o(\d+)$/);
    return (
      duplicated === null
        ? name.split(".")
        : [...duplicated[1]!.split("."), `o${duplicated[2]!}`]
    ).map((segment, index, accessors) =>
      identifier(segment, index === 0, index === accessors.length - 1),
    );
  };

  // Unicode IdentifierStart/IdentifierPart additionally admit $ and _, and
  // IdentifierPart admits the two joining controls. Iterate code points so a
  // supplementary letter is kept whole and an isolated surrogate is encoded.
  const identifier = (
    segment: string,
    root: boolean,
    leaf: boolean,
  ): string => {
    const fragments: string[] = [];
    for (const point of segment) {
      const valid = (
        fragments.length === 0 ? identifierStart : identifierPart
      ).test(point);
      fragments.push(
        valid
          ? point
          : `_x${point.codePointAt(0)!.toString(16).toUpperCase()}_`,
      );
    }
    const output = fragments.join("");
    if (output.length === 0) return "_";
    return reserved.has(output) ||
      (root && output === "await") ||
      ((root || leaf) && typeNames.has(output))
      ? `_${output}`
      : output;
  };

  const identifierStart = /^[$_\p{ID_Start}]$/u;
  const identifierPart = /^[$_\u200C\u200D\p{ID_Continue}]$/u;

  // ECMAScript strict/module bindings and names TypeScript reserves for its
  // intrinsic types. Contextual labels such as type, async and readonly remain
  // ordinary identifiers here.
  const reserved = new Set([
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "implements",
    "interface",
    "let",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield",
  ]);

  // These names are forbidden for type aliases and imported bindings, but a
  // nested namespace can use them. Await likewise remains legal inside a
  // namespace, whose scope is distinct from the surrounding external module.
  const typeNames = new Set([
    "any",
    "unknown",
    "never",
    "number",
    "bigint",
    "boolean",
    "string",
    "symbol",
    "object",
    "undefined",
  ]);
}
