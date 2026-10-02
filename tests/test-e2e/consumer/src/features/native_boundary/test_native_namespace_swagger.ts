import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Verifies the original same-named namespace method sites both reach Swagger.
 *
 * Class and method spellings alone cannot identify the two AST declarations.
 * This inspects their independently decorated paths in the actual document.
 *
 * 1. Compile and generate from the original North and South namespace sites.
 * 2. Require both literal Swagger paths in the shared generated document.
 *
 * @evidence contracts/testing.md#behavioral-verification Both actual generated north/duplicate and south/duplicate paths must exist; dropping either source site fails this case.
 * @evidence contracts/testing.md#independent-expectations The original two Controller path literals and TypedRoute duplicate literals establish expected paths, independently of generated route enumeration.
 * @evidence contracts/testing.md#distinguishing-cases Same DuplicateController.duplicate spellings contrast distinct namespace parents and routes. Two required paths reject last-site overwrite or first-site reuse.
 * @evidence contracts/testing.md#execution-ownership The sole consumer DynamicExecutor discovers and awaits this matching export after installed producer/generation/consumer preparation. Missing document/path errors reject its report.
 * @evidence contracts/e2e.md#necessary-boundary Native source-site identity must reach actual reflected controller discovery and serialized Swagger; a direct method-key unit cannot prove both surviving endpoints.
 * @evidence contracts/e2e.md#shared-execution Existing producer, All generation, consumer compilation, installation and adapter lifetimes supply the document; this function performs one immutable file read and starts no host/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The native_boundary prefix prevents collisions with other routes while original namespace/class/method identities remain. The document belongs to the current unique sandbox and is read without mutation.
 * @evidence contracts/e2e.md#preserved-coverage Original assertNativeNamespaceMethods north/south existence controls retain exact mapped destinations; only a shared route prefix is added. Original source-input loading remains separately owned and no legacy feature is removed here.
 */
export const test_native_namespace_swagger = async (): Promise<void> => {
  const document = JSON.parse(
    await fs.readFile(
      path.resolve(__dirname, "../../../../../swagger.json"),
      "utf8",
    ),
  );
  for (const route of [
    "/native_boundary/north/duplicate",
    "/native_boundary/south/duplicate",
  ])
    assert.notEqual(
      document.paths?.[route],
      undefined,
      `Missing original namespace route ${route}`,
    );
};
