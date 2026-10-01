import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies source-file SDK generation includes `.mts` and `.cts` controller
 * modules.
 *
 * The source-input generator compiles controllers to a temporary runtime
 * directory before reading reflected route metadata. TypeScript emits `.mts` as
 * `.mjs` and `.cts` as `.cjs`; the loader must follow those emitted names
 * instead of assuming every source becomes `.js`.
 *
 * 1. Generate the SDK from controllers stored in `.mts` and `.cts` files.
 * 2. Touch both generated SDK accessors and assert each path is preserved.
 * 3. Call both routes through the generated SDK to prove the dynamic runtime
 *    module loader imports them too.
 *
 * @evidence contracts/testing.md#behavioral-verification Both cts/mts source-input routes must generate exact paths and deliver exact cts/mts payloads.
 * @evidence contracts/testing.md#independent-expectations Authored .cts/.mts controllers declare these paths and literal responses independently of loader extension mapping.
 * @evidence contracts/testing.md#distinguishing-cases CommonJS .cjs and ESM .mjs emitted names contrast ordinary .js; actual calls supplement source accessor/path presence.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_source_extension after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The actual installed SDK CLI source finder, temporary compiler and reflected emitted module loader must agree on .cts/.mts; an app-input producer would bypass this necessary SDK file-input boundary.
 * @evidence contracts/e2e.md#shared-execution The necessary file-input CLI program remains separate while packed installation and native cache are shared with the suite. Both extension cases share that one generator/compiler/backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Connections and supplied values belong to this invocation; simulate flags and header objects are local copies. Sequential cases share only their feature backend, which the entry closes in finally; copied outputs remain isolated.
 * @evidence contracts/e2e.md#preserved-coverage The test_source_extension selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_source_extension = async (
  connection: api.IConnection,
): Promise<void> => {
  api.functional.source_extension.cts.METADATA;
  api.functional.source_extension.mts.METADATA;

  if (api.functional.source_extension.cts.path() !== "/source-extension/cts")
    throw new Error("Generated SDK must include the .cts controller route.");
  if (api.functional.source_extension.mts.path() !== "/source-extension/mts")
    throw new Error("Generated SDK must include the .mts controller route.");

  TestValidator.equals(
    "cts payload",
    await api.functional.source_extension.cts(connection),
    "cts",
  );
  TestValidator.equals(
    "mts payload",
    await api.functional.source_extension.mts(connection),
    "mts",
  );
};
