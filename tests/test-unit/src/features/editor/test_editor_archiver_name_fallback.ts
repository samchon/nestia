import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies empty and dots-only archive bases use the default package name.
 *
 * A package name of only dots or of nothing gave an archive without a usable
 * base, so the default package name is used instead. A nonempty dotted base
 * retains its dots, including a leading dot.
 *
 * 1. Name archives for an empty, a dots-only, and a symbols-only package name.
 * 2. Assert the first two fall back to the default package's file name.
 * 3. Assert a scoped name and a dotted name keep their own file names.
 *
 * @evidence contracts/testing.md#behavioral-verification Empty, dots-only and stripped-scope inputs must produce the literal default archive name; scoped, dotted and leading-dot names retain their own literal results. This detects missing fallback without claiming every hidden filename is rejected.
 * @evidence contracts/testing.md#independent-expectations The shared product default is ORGANIZATION/PROJECT, whose filename is the authored literal ORGANIZATION-PROJECT.zip. The character whitelist independently yields scope-name.zip, my.app.zip and .my-app.zip for the retained-name controls.
 * @evidence contracts/testing.md#distinguishing-cases Empty, ... and @ have no usable base; @scope/name, my.app and .my-app distinguish scope/separator cleanup and retention of meaningful dots.
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
    [".my-app", ".my-app.zip"],
  ];
  for (const [input, output] of expected)
    if (archiver.name(input) !== output)
      throw new Error(
        `archive name of ${JSON.stringify(input)} was ${archiver.name(input)}, not ${output}.`,
      );
};
