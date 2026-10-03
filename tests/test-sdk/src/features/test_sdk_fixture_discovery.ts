import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  discoverSdkFixtures,
} = require("../integration/internal/SdkFixtureDiscovery.ts");

/**
 * Verifies fixture discovery requires its current execution configuration.
 *
 * Generated remnants do not define a runnable fixture after source retirement.
 * Custom configuration names and genuine error fixtures still belong to the
 * source population, and later changes must be visible without a cache reset.
 *
 * 1. Create ordinary, custom, error and generated-only directory inputs.
 * 2. Remove and add configurations and check discovery observes both changes.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual directory discovery returns configured ordinary, custom and error inputs, excludes generated-only remnants, config-named directories, files and scratch roots, and observes removal/addition on its next invocation.
 * @evidence contracts/testing.md#independent-expectations Authored temporary directory contents and literal expected fixture names define enrollment independently of the scanner. Config contents are deliberately malformed because validation belongs to the generator, not discovery.
 * @evidence contracts/testing.md#distinguishing-cases Empty roots, valid config files, a custom filename, malformed config contents, missing configs, a directory named like a config, a non-directory entry and changed inputs distinguish source ownership without excluding real failure cases. Missing roots throw.
 * @evidence contracts/testing.md#execution-ownership The SDK direct unit entry discovers this matching export. Real filesystem inputs exercise a portable scanner without installation, native compilation, CLI, host or worker execution; finally releases the unique temporary root.
 */
export const test_sdk_fixture_discovery = (): void => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-sdk-discovery-"));
  const configurationName = (name: string): string =>
    name === "custom" ? "custom.config.ts" : "nestia.config.ts";
  try {
    assert.deepEqual(discoverSdkFixtures(root, configurationName), []);
    for (const name of [
      "ordinary",
      "custom",
      "error",
      "retired",
      "invalid",
      ".tmp-copy",
    ])
      fs.mkdirSync(path.join(root, name));
    for (const name of ["ordinary", "custom", "error", ".tmp-copy"])
      fs.writeFileSync(
        path.join(root, name, configurationName(name)),
        "malformed config",
      );
    fs.mkdirSync(path.join(root, "retired", "node_modules"));
    fs.mkdirSync(path.join(root, "invalid", "nestia.config.ts"));
    fs.writeFileSync(path.join(root, "not-a-directory"), "input");
    assert.deepEqual(discoverSdkFixtures(root, configurationName), [
      "custom",
      "error",
      "ordinary",
    ]);
    fs.unlinkSync(path.join(root, "ordinary", "nestia.config.ts"));
    fs.writeFileSync(
      path.join(root, "retired", "nestia.config.ts"),
      "new config",
    );
    assert.deepEqual(discoverSdkFixtures(root, configurationName), [
      "custom",
      "error",
      "retired",
    ]);
    assert.throws(() =>
      discoverSdkFixtures(path.join(root, "missing"), configurationName),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
