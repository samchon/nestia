import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies failed bundle metadata reads permit later input-filter recovery.
 *
 * A promise singleton retains rejection even after the filesystem is repaired.
 * An owned copy of the built module isolates its cache and installed assets
 * without changing production files or replacing filesystem methods.
 *
 * 1. Load copied production utilities with an initially absent API bundle.
 * 2. Observe concurrent failures, create the bundle and retry successfully.
 * 3. Check generated file/directory exclusion and the no-output control.
 *
 * @evidence contracts/testing.md#behavioral-verification Concurrent output-bound calls reject for absent bundle assets, then the same module successfully creates a filter after those owned assets appear. Exact decisions distinguish generated bundle file/directory roots from an authored sibling.
 * @evidence contracts/testing.md#independent-expectations The fixture deliberately starts without assets and creates index.ts and helpers afterward. Native ENOENT and SDK ownership of those concrete bundle entries establish expectations independently of the cache implementation.
 * @evidence contracts/testing.md#distinguishing-cases Two concurrent failed requests and a later repaired retry distinguish rejected-promise retention. An undefined output succeeds before asset creation; bundle file, directory descendant and authored file distinguish the recovered metadata's meaning.
 * @evidence contracts/testing.md#execution-ownership Unit: the discoverable export loads copied built utility modules over inert owned files, sharing installed dependencies through a junction. It starts no compiler, process or backend and removes the copy in finally.
 */
export const test_sdk_input_filter_asset_recovery = async (): Promise<void> => {
  const installed = path.resolve(process.cwd(), "../../packages/sdk");
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-filter-recovery-"),
  );
  try {
    const utilities = path.join(root, "lib/utils");
    fs.mkdirSync(utilities, { recursive: true });
    for (const name of ["SdkInputFilter", "SdkBundlePath", "SourceFinder"])
      fs.copyFileSync(
        path.join(installed, "lib/utils", `${name}.js`),
        path.join(utilities, `${name}.js`),
      );
    fs.symlinkSync(
      path.join(installed, "node_modules"),
      path.join(root, "node_modules"),
      "junction",
    );
    const { SdkInputFilter } = require(
      path.join(utilities, "SdkInputFilter.js"),
    ) as {
      SdkInputFilter: {
        create: (
          output: string | undefined,
        ) => Promise<(file: string) => Promise<boolean>>;
      };
    };
    const output = path.join(root, "output");
    const plain = await SdkInputFilter.create(undefined);
    TestValidator.equals(
      "no-output needs no bundle",
      await plain(path.join(output, "index.ts")),
      true,
    );
    const failures = await Promise.allSettled([
      SdkInputFilter.create(output),
      SdkInputFilter.create(output),
    ]);
    TestValidator.equals(
      "concurrent missing bundle failures",
      failures.map((result) =>
        result.status === "rejected"
          ? (result.reason as NodeJS.ErrnoException).code
          : "fulfilled",
      ),
      ["ENOENT", "ENOENT"],
    );
    const assets = path.join(root, "assets/bundle/api");
    fs.mkdirSync(path.join(assets, "helpers"), { recursive: true });
    fs.writeFileSync(path.join(assets, "index.ts"), "export {};\n");
    const filter = await SdkInputFilter.create(output);
    TestValidator.equals(
      "recovered bundle ownership",
      await Promise.all(
        ["index.ts", "helpers/nested.ts", "authored.ts"].map((file) =>
          filter(path.join(output, file)),
        ),
      ),
      [false, false, true],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
