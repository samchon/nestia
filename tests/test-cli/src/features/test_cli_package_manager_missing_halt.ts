import { TestValidator } from "@nestia/e2e";

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
 * @evidence contracts/testing.md#behavioral-verification When both availability probes fail, the starter reports installation guidance and stops after cloning, without a lifecycle command.
 * @evidence contracts/testing.md#independent-expectations A pnpm-only template needs guidance naming pnpm and its corepack alternative when neither exists; the literal single git command establishes the permitted pre-halt effect.
 * @evidence contracts/testing.md#distinguishing-cases This case owns both tools unavailable; direct pnpm and corepack fallback provide complementary successful choices.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
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
