import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Resolves the actual installed CLI and its SDK/core runtime dependency edges.
 *
 * Workspace exports select product TypeScript sources. The migration fixture
 * must instead use published JavaScript while retaining its real controller
 * compilation and generation connection.
 *
 * 1. Resolve the installed bin and SDK executable through ordinary manifests.
 * 2. Require contained JavaScript addresses for the CLI, SDK and core.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual Node createRequire resolution follows the installed CLI's public SDK executable edge and the SDK's core edge. All selected entries must be JavaScript within the installed root, and the returned actual bin is the migration generator's executable.
 * @evidence contracts/testing.md#independent-expectations Published runtime entries are JavaScript installed in the private consumer; a repository TypeScript source or escaping workspace address cannot satisfy that contract. Expected addresses are resolved from actual package manifests, not a generated output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases CLI bin, public SDK executable and core root cover the source-reentry chain. Extension and native containment reject source entries and workspace escapes; the following actual CLI Swagger gate covers execution, internal module assembly and generated metadata.
 * @evidence contracts/testing.md#execution-ownership Migration integration main invokes this matching export after public installation and uses its returned bin in the real Swagger command. Direct migration units do not install or execute this population.
 * @evidence contracts/e2e.md#necessary-boundary The current packed package graph and published export maps must assemble the actual CLI-to-SDK-to-core connection. Authored resolver units cannot prove those installed artifact edges select built runtimes.
 * @evidence contracts/e2e.md#shared-execution The existing migration public installation supplies every address; this case adds only ordinary manifest/resolver reads, not another installation, compiler, CLI or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The caller freshly packs and validates its ordinary installed graph before this case. Native paths establish containment without changing package exports or inheriting a foreign resolution hook; the following plain-Node child clears workspace loader settings.
 * @evidence contracts/e2e.md#preserved-coverage This new connection assertion supplements the original three-controller/ten-route Swagger assertions, combined generated-project compilation, invalid project controls and simulator assertion; it replaces no original oracle.
 */
export const test_migrate_installed_cli_resolution = (
  root: string,
  requirePublic: NodeJS.Require,
): string => {
  const manifest = requirePublic.resolve("nestia/package.json");
  const pack = JSON.parse(fs.readFileSync(manifest, "utf8"));
  const bin = path.resolve(path.dirname(manifest), pack.bin.nestia);
  const cliRequire = createRequire(bin);
  const sdk = cliRequire.resolve("@nestia/sdk/lib/executable/sdk");
  const sdkRequire = createRequire(sdk);
  for (const entry of [bin, sdk, sdkRequire.resolve("@nestia/core")]) {
    assert.match(entry, /\.(?:c|m)?js$/);
    const relative = path.relative(root, entry);
    assert(
      relative &&
        relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative),
      `CLI runtime escaped public installation: ${entry}`,
    );
  }
  console.log(
    "Migration installed CLI resolution: CLI, SDK and core JavaScript entries passed.",
  );
  return bin;
};
