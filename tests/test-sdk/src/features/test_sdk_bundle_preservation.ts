import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { SdkGenerator } from "../../../../packages/sdk/lib/generates/SdkGenerator";
import { SdkBundlePreservation } from "../internal/SdkBundlePreservation";

/**
 * Verifies SDK regeneration preserves custom files and restores missing files.
 *
 * Bundle copying is a filesystem decision, so it needs no CLI or native host.
 * The installed HTTP consumer separately compiles the same customized
 * scaffold.
 *
 * 1. Generate all six shipped scaffold files and check their exact bytes.
 * 2. Customize two barrels, delete HttpError and regenerate.
 * 3. Check custom bytes, restored bytes and untouched files, then remove output.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual built SdkGenerator.generate executes twice. The shared scenario asserts all six initial bundle files, both customized barrels, restored HttpError and three untouched files byte for byte.
 * @evidence contracts/testing.md#independent-expectations Shipped bundle assets establish copying bytes, and authored literals establish customization bytes. Neither oracle reads regenerated output to construct its expectation.
 * @evidence contracts/testing.md#distinguishing-cases Empty output requires copying; existing customized module/index must survive; deleted HttpError must return; unmodified IConnection/Primitive/Resolved must remain intact. Existing rich installed consumer checks real generated scaffold compilation.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching unit export. The case calls the built generator directly with an authored void GET route and owns one unique temporary directory through finally; it installs nothing and starts no compiler or host.
 */
export async function test_sdk_bundle_preservation(): Promise<void> {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "nestia-sdk-bundle-"),
  );
  try {
    await SdkBundlePreservation(
      SdkGenerator.generate,
      SdkGenerator.BUNDLE_PATH,
      path.join(directory, "api"),
    );
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    assert.ok(path.basename(directory).startsWith("nestia-sdk-bundle-"));
    await fs.rm(directory, { recursive: true, force: true });
  }
}
