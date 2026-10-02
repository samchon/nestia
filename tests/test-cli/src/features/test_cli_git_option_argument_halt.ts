import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies rejection of destination and repository values git would interpret
 * as options.
 *
 * Argument vectors preserve shell boundaries, but git still interprets a
 * leading dash as an option. Reject those operands before cloning user input.
 *
 * 1. Supply a dash-prefixed destination or repository to both scaffold engines.
 * 2. Assert the option-specific guidance is returned.
 * 3. Assert no command, directory change or cleanup has occurred.
 *
 * @evidence contracts/testing.md#behavioral-verification Both scaffold engines reject a dash-prefixed destination or repository before executing a command or entering a directory.
 * @evidence contracts/testing.md#independent-expectations Git interprets dash-prefixed operands as options in this clone invocation, so rejection is required independently of the parser implementation; literal empty effect lists assert the pre-clone guard.
 * @evidence contracts/testing.md#distinguishing-cases The matrix checks a dash-prefixed destination, a dash-prefixed URL and another option consumed as the URL for both commands. Ordinary positional and override values have successful twins in the sequence and override units.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export and runs both built engine functions through fake effects, without spawning git or a CLI process.
 */
export const test_cli_git_option_argument_halt = async (): Promise<void> => {
  for (const argv of [
    ["-project"],
    ["project", "--repository", "-repository"],
    ["project", "--repository", "--repository"],
  ]) {
    for (const cloner of [
      CliTestHarness.getStarter(),
      CliTestHarness.getTemplate(),
    ]) {
      const fake = CliTestHarness.createFakeContext();
      const reason = await CliTestHarness.expectHalt(() =>
        cloner(CliTestHarness.halter, fake.context)(argv),
      );
      TestValidator.equals(
        "option-like value guidance",
        reason,
        "The destination and the repository must not start with a dash, which git would read as an option.",
      );
      TestValidator.equals("commands", fake.commands, []);
      TestValidator.equals("directory changes", fake.chdirs, []);
      TestValidator.equals("cleanup", fake.removed, []);
    }
  }
};
