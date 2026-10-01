import { TestValidator } from "@nestia/e2e";
import path from "path";

/**
 * Verifies `escapeNonVariable` turns every segment of a DTO name into a valid
 * identifier and leaves valid names untouched.
 *
 * A schema key is a qualified name whose dots separate namespaces, but the
 * escape treated the whole string as one identifier and knew only a table of
 * punctuation. Characters outside the table, reserved words after a dot and
 * strict-mode words produced TypeScript that does not compile.
 *
 * 1. Escape keys with unlisted characters, a reserved word or a leading digit
 *    after a dot, strict-mode words, predefined type names and empty segments.
 * 2. Assert each result is a dotted list of valid, non-reserved identifiers.
 * 3. Assert names that were already valid, and the old table's results, are
 *    returned exactly as before.
 *
 * @evidence contracts/testing.md#behavioral-verification The built escape runs on keys that each broke a different rule, and every segment of the result is checked against the ECMAScript identifier grammar and a reserved list that the test owns, so a missing rule leaves an invalid segment.
 * @evidence contracts/testing.md#independent-expectations The identifier grammar is a Unicode ID_Start/ID_Continue regular expression and the reserved list is authored from the ECMAScript specification in the test; exact outputs are asserted only for names the previous implementation already handled.
 * @evidence contracts/testing.md#distinguishing-cases Invalid keys with unlisted characters, dotted reserved or digit-led segments, strict-mode words, type names and empty segments are the cases; plain, dotted, underscore and non-ASCII names are the unchanged controls, and the last segment alone gets the type-name rule as a boundary.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-migrate process against the built migrate library, loaded by path because the exports map hides it; it touches no file or network.
 */
export function test_migrate_escape_non_variable_segments(): void {
  const { StringUtil } = require(
    path.join(
      process.cwd(),
      "..",
      "..",
      "packages",
      "migrate",
      "lib",
      "utils",
      "StringUtil.js",
    ),
  ) as { StringUtil: { escapeNonVariable: (key: string) => string } };
  const escape = StringUtil.escapeNonVariable;

  const reserved: Set<string> = new Set(
    (
      "await break case catch class const continue debugger default delete do else enum export " +
      "extends false finally for function if implements import in instanceof interface let new null " +
      "package private protected public return static super switch this throw true try typeof var " +
      "void while with yield"
    ).split(" "),
  );
  const identifier: RegExp = /^[\p{ID_Start}_$][\p{ID_Continue}$]*$/u;

  for (const key of [
    "Page«Pet»",
    "A=B",
    "Foo~Bar",
    "Foo\nBar",
    "a/b",
    "Foo.delete",
    "Foo.1Bar",
    "Foo.let.static",
    "delete",
    "let",
    "yield",
    "static",
    "interface",
    "1-2",
    ".Foo",
    "Foo..Bar",
    "Foo.",
    "Hello World",
  ]) {
    const segments: string[] = escape(key).split(".");
    TestValidator.predicate(
      `${JSON.stringify(key)} -> ${segments.join(".")}`,
      segments.every(
        (segment) => identifier.test(segment) && !reserved.has(segment),
      ),
    );
  }
  for (const type of ["string", "number", "any", "object", "unknown"]) {
    TestValidator.equals(`type name ${type}`, escape(type), `_${type}`);
    TestValidator.equals(
      `namespace segment ${type}`,
      escape(`${type}.IFoo`),
      `${type}.IFoo`,
    );
    TestValidator.equals(
      `last segment ${type}`,
      escape(`IFoo.${type}`),
      `IFoo._${type}`,
    );
  }

  for (const key of [
    "IBbsArticle",
    "IBbs.IArticle.ISummary",
    "_internal",
    "I18n",
    "한글",
    "Foo.Bar.Baz",
  ])
    TestValidator.equals(`unchanged ${key}`, escape(key), key);
  for (const [key, expected] of [
    ["x$y", "x_dollar_y"],
    ["Hello World", "Hello_space_World"],
    ["1-2", "_1_2"],
    [" delete", "_delete"],
    ["", "_empty_"],
    ["a<b>", "a_lt_b_gt_"],
  ] as const)
    TestValidator.equals(`table ${JSON.stringify(key)}`, escape(key), expected);
}
