import { TestValidator } from "../../../../packages/e2e/lib";
import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the scaffolder halts with installation guidance when neither pnpm
 * nor corepack is available.
 *
 * Falling through to npm — the old behavior — would hard-fail deep inside `npm
 * install` with a cryptic `catalog:` protocol error. Halting before any install
 * attempt, with a message telling the user how to get pnpm, is the contract
 * this test pins down.
 *
 * 1. Run `nestia start` with a fake context where every probe fails.
 * 2. Assert the command halts and the message names pnpm and corepack.
 * 3. Assert no package manager command was ever executed.
 *
 * @evidence contracts/testing.md#behavioral-verification Unavailable pnpm/corepack returns both-name guidance and performs only the original git clone.
 * @evidence contracts/testing.md#independent-expectations The authored probes all reject; catalog dependencies require pnpm so an npm installation would be invalid.
 * @evidence contracts/testing.md#distinguishing-cases The exact command list distinguishes a halted package-manager decision from starting a fallback install.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct unit through test-cli test:unit. Caller-built starter/template operations execute with the authored command context, not a native scaffold process.
 */
export const test_cli_package_manager_missing_halt =
  async (): Promise<void> => {
    const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext({
      probe: () => false,
    });
    const reason: string | undefined = await CliTestHarness.expectHalt(() =>
      CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        "my-project",
      ]),
    );

    TestValidator.predicate(
      "guidance",
      reason !== undefined &&
        reason.includes("pnpm") &&
        reason.includes("corepack"),
    );
    TestValidator.equals("commands", fake.commands, [
      {
        executable: "git",
        args: [
          "clone",
          "https://github.com/samchon/nestia-start",
          "my-project",
        ],
      },
    ]);
  };
