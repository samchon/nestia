import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies the editor's default package placeholder has the standard
 * organization spelling.
 *
 * Why: The uploader passes this value into migration, so a typo becomes the
 * generated package name and import prefix throughout a downloaded project.
 *
 * 1. Server-render the built uploader and read its initial package input.
 * 2. Compose an SDK with that observed value and check its package manifest.
 *
 * @evidence contracts/testing.md#behavioral-verification It server-renders the built uploader, reads its initial package value, composes an SDK with it, and asserts the placeholder spelling and that the manifest carries `@ORGANIZATION/PROJECT-api`.
 * @evidence contracts/testing.md#independent-expectations The spelling `@ORGANIZATION/PROJECT` is the documented default, and the manifest name is derived by migrate, so the value is judged in two independent places.
 * @evidence contracts/testing.md#distinguishing-cases A typo in the placeholder fails the literal comparison, and its propagation into the manifest is the adjacent assertion.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, against the built `@nestia/editor` library that the package ships; the internals are loaded by absolute path because the exports map hides them, and no browser, bundler, or server starts.
 */
export const test_editor_uploader_default_package = async (): Promise<void> => {
  const markup: string = EditorTestHarness.uploaderMarkup();
  const packageName: string | undefined = markup.match(/value="(@[^"]+)"/)?.[1];
  if (packageName === undefined)
    throw new Error("The editor uploader has no package input value.");
  if (packageName !== "@ORGANIZATION/PROJECT")
    throw new Error(`Unexpected editor package placeholder: ${packageName}`);

  const result = await EditorTestHarness.composer().sdk({
    document: EditorTestHarness.document(),
    e2e: false,
    keyword: true,
    simulate: false,
    package: packageName,
  });
  if (result.success !== true)
    throw new Error(`sdk composition failed: ${JSON.stringify(result.errors)}`);

  const manifest: string | undefined = result.data?.files["package.json"];
  if (manifest?.includes('"name": "@ORGANIZATION/PROJECT-api"') !== true)
    throw new Error(
      "The editor default package was not propagated to the SDK.",
    );
};
