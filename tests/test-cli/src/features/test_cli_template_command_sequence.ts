import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

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
 * @evidence contracts/testing.md#behavioral-verification The template must clone the backend repository, install and build with pnpm, omit the test command and remove repository metadata.
 * @evidence contracts/testing.md#independent-expectations The template command's public repository and no-test lifecycle determine the literal three-command vector and cleanup paths.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the template flag disabling tests; the starter sequence provides the test-enabled twin.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
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
