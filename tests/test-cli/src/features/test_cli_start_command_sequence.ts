import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

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
 * @evidence contracts/testing.md#behavioral-verification The starter records clone/install/build/test command order, entry into the destination and removal of two repository-only paths.
 * @evidence contracts/testing.md#independent-expectations The starter contract supplies the public repository URL, pnpm lifecycle verbs and cleanup paths; the expected commands are literal.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the absent destination with direct pnpm and tests enabled; template omission, existing destinations and alternate manager choices have separate units.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
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
