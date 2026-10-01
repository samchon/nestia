const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies actual SDK generation preserves the original customized bundle.
 *
 * A direct missing-only policy unit cannot establish that full SDK generation
 * invokes that policy or that preserved exports still form a compilable SDK.
 * This case places the original customized state in the shared consumer output.
 *
 * 1. Fill that output with the installed bundle and compare six asset bytes.
 * 2. Install original custom module/index and delete HttpError.
 * 3. After the caller's existing All generation, verify preservation/restoration;
 *    the caller then compiles this same output in its existing consumer program.
 *
 * @evidence contracts/testing.md#behavioral-verification The installed bundle fills six missing files; full All generation must preserve original custom module/index, restore HttpError and retain three untouched asset files. The same output then enters actual consumer compilation, so invalid preserved exports fail preparation.
 * @evidence contracts/testing.md#independent-expectations Six original filenames and installed asset bytes establish initial/untouched/restored expectations; original authored customization literals establish exact preservation. The returned verifier reads actual artifacts after generation, not a precomputed snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Empty, customized-existing, unchanged-existing and deleted files distinguish unconditional overwrite and skipped restoration. custom.ts remains a separate unchanged source consumed by compilation.
 * @evidence contracts/testing.md#execution-ownership The sole E2E entry awaits this matching export before existing All generation, invokes its verifier afterward and compiles the same consumer tree once. The SDK direct filesystem unit separately owns policy controls; this case owns the installed generation/compilation connection.
 * @evidence contracts/e2e.md#necessary-boundary Actual generator invocation must reach missing-only bundle emplacement, and the preserved SDK index/module must resolve with generated functions in a real consumer program. A direct copier unit cannot prove that integration.
 * @evidence contracts/e2e.md#shared-execution One direct initial bundle call and the caller's already required All internal bundle call share the installed package and output. No additional full generator, compiler, installation, application or backend is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The caller supplies its unique main consumer output. All bytes belong to that sandbox and survive through the actual consumer compile before caller cleanup; this case modifies no installed asset or process state. The returned closure retains only original strings/path and does not keep resource handles.
 * @evidence contracts/e2e.md#preserved-coverage Original bundle-preserve six baseline byte controls, two customization byte controls, HttpError restoration, three untouched byte controls and final compile retain precise ownership. No original feature is removed before the shared execution proves this connection.
 */
const test_sdk_bundle_preserves_customized_output = async ({ installation, output, record }) => {
  const packageFile = require.resolve("@nestia/sdk/package.json", { paths: [installation.directory] });
  const sdkRoot = path.dirname(packageFile);
  const { SdkGenerator } = require(path.join(sdkRoot, "lib/generates/SdkGenerator.js"));
  fs.mkdirSync(output, { recursive: true });
  const files = ["HttpError.ts", "IConnection.ts", "index.ts", "module.ts", "Primitive.ts", "Resolved.ts"];
  const bundled = (file) => fs.readFileSync(path.join(sdkRoot, "assets/bundle/api", file), "utf8");
  const actual = (file) => fs.readFileSync(path.join(output, file), "utf8");
  await SdkGenerator.bundle(output);
  for (const file of files) assert.equal(actual(file), bundled(file), `First bundle ${file}`);
  const customModule = [
    'export type * from "./IConnection";',
    'export * from "./HttpError";',
    'export type * from "./custom";',
    "",
    'export * as functional from "./functional/index";',
    "",
  ].join("\n");
  const customIndex = [
    'import * as api from "./module";',
    "",
    'export * from "./module";',
    'export type * from "./custom";',
    "",
    "export default api;",
    "",
  ].join("\n");
  const custom = "export type Custom = { value: string };\n";
  fs.writeFileSync(path.join(output, "custom.ts"), custom);
  fs.writeFileSync(path.join(output, "module.ts"), customModule);
  fs.writeFileSync(path.join(output, "index.ts"), customIndex);
  fs.unlinkSync(path.join(output, "HttpError.ts"));
  record("sdk-bundle-pre-generation.json", { files, customModule, customIndex, custom, directBundleRequests: 1, extraCompilerRequests: 0, extraGenerationRequests: 0 });
  return () => {
    assert.equal(actual("module.ts"), customModule, "Customized module preserved");
    assert.equal(actual("index.ts"), customIndex, "Customized index preserved");
    assert.equal(actual("custom.ts"), custom, "Custom source preserved");
    for (const file of ["HttpError.ts", "IConnection.ts", "Primitive.ts", "Resolved.ts"])
      assert.equal(actual(file), bundled(file), `Restored or untouched ${file}`);
    record("sdk-bundle-post-generation.json", { customModule: actual("module.ts"), customIndex: actual("index.ts"), restoredHttpError: true, untouched: ["IConnection.ts", "Primitive.ts", "Resolved.ts"], sameConsumerOutput: output });
  };
};
module.exports = { test_sdk_bundle_preserves_customized_output };
