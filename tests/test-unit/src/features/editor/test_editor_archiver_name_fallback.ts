import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies the archive name never becomes a hidden file or a path component.
 *
 * A package name of only dots or of nothing gave `..zip` or `.zip`, which is a
 * hidden file or a relative path component, so the default package name is used
 * instead.
 *
 * 1. Name archives for an empty, a dots-only, and a symbols-only package name.
 * 2. Assert the first two fall back to the default package's file name.
 * 3. Assert a scoped name and a dotted name keep their own file names.
 *
 * @evidence contracts/testing.md#behavioral-verification It names archives for empty, dots-only, and symbols-only packages and asserts the default package's file name, which detects `.zip` and `..zip`.
 * @evidence contracts/testing.md#independent-expectations A hidden file or a path component is never a valid download name, so the expected values are the default's file name and the literals `scope-name.zip` and `my.app.zip`.
 * @evidence contracts/testing.md#distinguishing-cases Empty, `...`, and `@` are the failing inputs and a scoped and a dotted name are the adjacent inputs that must keep their names.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_archiver_name_fallback = (): void => {
  const archiver = EditorTestHarness.archiver();
  const fallback: string = "ORGANIZATION-PROJECT.zip";
  const expected: Array<[string, string]> = [
    ["", fallback],
    ["...", fallback],
    ["@", fallback],
    ["@scope/name", "scope-name.zip"],
    ["my.app", "my.app.zip"],
  ];
  for (const [input, output] of expected)
    if (archiver.name(input) !== output)
      throw new Error(
        `archive name of ${JSON.stringify(input)} was ${archiver.name(input)}, not ${output}.`,
      );
};
