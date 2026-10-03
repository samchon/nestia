import { TestValidator } from "../../../../packages/e2e/lib";
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
 * @evidence contracts/testing.md#behavioral-verification Empty and repository-only argv halt with undefined reason and zero commands in both engines.
 * @evidence contracts/testing.md#independent-expectations The destination is a required positional operand; a repository option pair cannot supply it.
 * @evidence contracts/testing.md#distinguishing-cases Both empty and option-only inputs distinguish absent destination from normal parsed input.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct unit through test-cli test:unit. Caller-built starter/template operations execute with the authored command context, not a native scaffold process.
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
