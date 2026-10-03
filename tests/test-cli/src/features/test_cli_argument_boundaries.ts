import { TestValidator } from "../../../../packages/e2e/lib";
import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies quotes and shell operators stay inside individual git arguments.
 *
 * Shell-like text is still one literal operand when the command boundary
 * receives a vector; flattening that vector would change its meaning.
 *
 * 1. Supply a repository and destination containing quotes and operators.
 * 2. Compare the recorded git clone vector with the exact authored operands.
 *
 * @evidence contracts/testing.md#behavioral-verification Literal quote/operator operands remain one git argument each.
 * @evidence contracts/testing.md#independent-expectations Authored repository and destination strings establish the exact clone argument vector independently of shell interpretation.
 * @evidence contracts/testing.md#distinguishing-cases Quote and shell-operator characters distinguish token preservation; this case does not execute a shell or prove dash-operand rejection.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct unit through test-cli test:unit. Caller-built starter/template operations execute with the authored command context, not a native scaffold process.
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
