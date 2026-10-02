import { EditorTestHarness } from "../internal/EditorTestHarness";

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
 * @evidence contracts/testing.md#behavioral-verification Server-rendering the actual uploader provides its initial package input; actual SDK composition must propagate that value into the generated manifest.
 * @evidence contracts/testing.md#independent-expectations The supported placeholder is the authored literal @ORGANIZATION/PROJECT and SDK package names use its -api suffix.
 * @evidence contracts/testing.md#distinguishing-cases The scoped default is observed at both rendered input and generated manifest; custom conversion options belong to composer units.
 * @evidence contracts/testing.md#execution-ownership The test-editor DynamicExecutor discovers this exported unit and calls built owning operations in-process without an installed consumer or live host. SSR module initialization stays separate from the browser population.
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
