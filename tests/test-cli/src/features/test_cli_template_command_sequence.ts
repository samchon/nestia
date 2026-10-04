import { TestValidator } from "../../../../packages/e2e/lib";
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
 * @evidence contracts/testing.md#behavioral-verification Template selects samchon/backend and emits install/build without a test command, then the original cleanup list.
 * @evidence contracts/testing.md#independent-expectations The template contract differs from starter in repository and lifecycle selection, established by literal independent vectors.
 * @evidence contracts/testing.md#distinguishing-cases Exact command sequence detects starter props leaking into template rather than only checking an endpoint URL.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct unit through test-cli test:unit. Caller-built starter/template operations execute with the authored command context, not a native scaffold process.
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
