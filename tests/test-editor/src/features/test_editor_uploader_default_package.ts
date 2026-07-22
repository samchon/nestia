import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies the editor's default package placeholder has the standard organization spelling.
 *
 * Why:
 * The uploader passes this value into migration, so a typo becomes the generated
 * package name and import prefix throughout a downloaded project.
 *
 * 1. Read the default used by the built editor uploader.
 * 2. Compose an SDK with it and assert the package manifest receives that exact prefix.
 */
export const test_editor_uploader_default_package = async (): Promise<void> => {
  const packageName: string = EditorTestHarness.defaultPackage();
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
    throw new Error("The editor default package was not propagated to the SDK.");
};
