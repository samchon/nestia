import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies both scaffolding commands halt with the usage message when no
 * destination directory is given.
 *
 * A missing directory argument must halt with `undefined` (the dispatcher
 * substitutes the usage text for it) before anything is cloned; note that a
 * lone `--repository <url>` pair must not be mistaken for the destination.
 *
 * 1. Run `nestia start` and `nestia template` with an empty argv.
 * 2. Run `nestia start` with only `--repository <url>`.
 * 3. Assert every case halts with an `undefined` reason and executes nothing.
 *
 * @evidence contracts/testing.md#behavioral-verification Both scaffold engines reject empty input and override-only input before any command executes.
 * @evidence contracts/testing.md#independent-expectations A destination is required independently of repository selection; undefined halt reason requests usage guidance and the empty command list excludes clone effects.
 * @evidence contracts/testing.md#distinguishing-cases Empty input and a complete repository option without a destination are checked for both commands; successful destinations belong to the sequence cases.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
 */
export const test_cli_missing_directory_argument_halt =
  async (): Promise<void> => {
    for (const argv of [
      [],
      ["--repository", "https://github.com/someone/fork"],
    ]) {
      for (const cloner of [
        CliTestHarness.getStarter(),
        CliTestHarness.getTemplate(),
      ]) {
        const fake: CliTestHarness.IFakeContext =
          CliTestHarness.createFakeContext();
        const reason: string | undefined = await CliTestHarness.expectHalt(() =>
          cloner(CliTestHarness.halter, fake.context)(argv),
        );
        TestValidator.equals("reason", reason, undefined);
        TestValidator.equals("commands", fake.commands, []);
      }
    }
  };
