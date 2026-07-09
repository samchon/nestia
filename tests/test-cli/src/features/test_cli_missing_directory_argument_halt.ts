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
