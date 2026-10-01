import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies the editor reports an invalid OpenAPI document as a failed
 * composition instead of returning a project, in both modes.
 *
 * The composer validates the document through `@nestia/migrate` before it
 * converts anything. A user can paste anything into the editor, so a document
 * that is not OpenAPI must come back as a failure carrying its errors, with no
 * files, while a valid document of the same shape composes.
 *
 * 1. Compose an sdk and a nest project from values that are not OpenAPI documents.
 * 2. Assert each composition fails, carries errors and holds no composed files.
 * 3. Compose the valid minimal document in both modes and assert it succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification It composes values that are no OpenAPI document through the built composer in both modes and asserts `success` is false with errors and no composed files, which a composer that skips validation or swallows its failure would not produce; the valid document composing is the control against a composer that fails everything.
 * @evidence contracts/testing.md#independent-expectations A value without the `openapi` or `swagger` version field, or that is not an object at all, is not an OpenAPI document by the OpenAPI specification, so refusing it is the contract; the valid minimal document is the same fixture the sibling composer tests rely on.
 * @evidence contracts/testing.md#distinguishing-cases An empty object, a string and `null` are the invalid inputs, in sdk and nest mode, beside the valid document in both modes.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-editor` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_composer_invalid_document =
  async (): Promise<void> => {
    const composer = EditorTestHarness.composer();
    const invalid: Array<[string, unknown]> = [
      ["empty object", {}],
      ["string", "swagger"],
      ["null", null],
    ];
    for (const mode of ["sdk", "nest"] as const) {
      for (const [title, document] of invalid) {
        const result = await composer[mode]({
          document: document as object,
          e2e: false,
          keyword: true,
          simulate: false,
        });
        if (
          result.success !== false ||
          (result.data as { files?: unknown } | undefined)?.files !==
            undefined ||
          Array.isArray(result.errors) === false ||
          (result.errors as unknown[]).length === 0
        )
          throw new Error(
            `${mode}: ${title} was not reported as a failure: ${JSON.stringify(result)}`,
          );
      }
      const valid = await composer[mode]({
        document: EditorTestHarness.document(),
        e2e: false,
        keyword: true,
        simulate: false,
      });
      if (valid.success !== true || valid.data === undefined)
        throw new Error(`${mode}: the valid document did not compose.`);
    }
  };
