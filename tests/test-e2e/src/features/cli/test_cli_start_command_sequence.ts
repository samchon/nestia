import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

/**
 * Verifies `nestia start` clones `nestia-start` and drives the full pnpm
 * lifecycle in order.
 *
 * The new template repository is a pnpm monorepo whose manifests use the
 * `catalog:` dependency protocol, which npm cannot resolve — the previous `npm
 * install` flow hard-failed on it. This locks the exact command sequence (pnpm,
 * not npm; canonical `nestia-start` URL, not the renamed `nestia-template`
 * redirect) plus the trailing repository-file cleanup.
 *
 * 1. Run the starter's `clone` against a fake context with pnpm available.
 * 2. Assert the executed commands are exactly clone → install → build → test.
 * 3. Assert `.git` and `.github/dependabot.yml` are removed afterwards.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the starter and asserts the executed commands are exactly clone, install, build, test and that `.git` and `.github/dependabot.yml` are removed afterwards.
 * @evidence contracts/testing.md#independent-expectations The sequence and the canonical `nestia-start` URL are the documented lifecycle, written literally, and pnpm is used because the template's `catalog:` protocol requires it.
 * @evidence contracts/testing.md#distinguishing-cases The exact list separates a missing, extra, or reordered step from the correct one.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-nestia` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
 */
export const test_cli_start_command_sequence = async (): Promise<void> => {
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    "my-project",
  ]);

  TestValidator.equals("commands", fake.commands, [
    {
      executable: "git",
      args: ["clone", "https://github.com/samchon/nestia-start", "my-project"],
    },
    { executable: "pnpm", args: ["install"] },
    { executable: "pnpm", args: ["run", "build"] },
    { executable: "pnpm", args: ["run", "test"] },
  ]);
  TestValidator.equals("chdir", fake.chdirs, ["my-project"]);
  TestValidator.equals("removed", fake.removed, [
    ".git",
    ".github/dependabot.yml",
  ]);
};
