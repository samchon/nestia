import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Keeps quotes and shell operators inside individual git arguments.
 *
 * @evidence contracts/testing.md#behavioral-verification The built starter receives quoted destination and repository values; the recorded git call retains each as one argument.
 * @evidence contracts/testing.md#independent-expectations The argument-vector contract passes the authored repository and destination unchanged after the clone verb; the expected vector is literal.
 * @evidence contracts/testing.md#distinguishing-cases Both values contain a quote and shell operator. Ordinary values belong to the command-sequence cases; missing values belong to the required-argument cases.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
 */
export const test_cli_argument_boundaries = async (): Promise<void> => {
  const repository = 'https://example.com/template" && malicious';
  const destination = 'project" && malicious';
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    destination,
    "--repository",
    repository,
  ]);
  TestValidator.equals("clone invocation", fake.commands[0], {
    executable: "git",
    args: ["clone", repository, destination],
  });
};
