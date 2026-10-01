import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

/**
 * Verifies `nestia template` clones `samchon/backend` and skips the test suite.
 *
 * Both scaffolding commands share one engine, so a regression in the
 * per-command props would silently make `template` inherit the starter's
 * behavior: wrong repository URL, or a `pnpm run test` step the heavier backend
 * template deliberately omits during scaffolding.
 *
 * 1. Run the template's `clone` against a fake context with pnpm available.
 * 2. Assert the clone targets `https://github.com/samchon/backend`.
 * 3. Assert no `pnpm run test` command is executed.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the template command and asserts the clone targets `https://github.com/samchon/backend` and no `pnpm run test` command is executed.
 * @evidence contracts/testing.md#independent-expectations The backend template's tests need infrastructure a fresh clone lacks, so skipping them is the contract, and the URL is written literally.
 * @evidence contracts/testing.md#distinguishing-cases The template's URL and missing test step are the differences from the starter's sequence.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
 */
export const test_cli_template_command_sequence = async (): Promise<void> => {
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getTemplate()(CliTestHarness.halter, fake.context)([
    "my-backend",
  ]);

  TestValidator.equals("commands", fake.commands, [
    {
      executable: "git",
      args: ["clone", "https://github.com/samchon/backend", "my-backend"],
    },
    { executable: "pnpm", args: ["install"] },
    { executable: "pnpm", args: ["run", "build"] },
  ]);
  TestValidator.equals("removed", fake.removed, [
    ".git",
    ".github/dependabot.yml",
  ]);
};
