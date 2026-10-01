import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

/**
 * Verifies the scaffolder passes a destination and a repository containing
 * shell metacharacters to `git` as single arguments.
 *
 * Shell command construction could interpret caller-supplied text as another
 * command. The flow must retain those strings in its explicit argument vector.
 *
 * 1. Run `nestia start` with a repository and a destination holding quotes and
 *    `&&`.
 * 2. Assert the clone command carries each as one argument, unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the starter with a repository and a destination such as `project" && malicious` and asserts the recorded clone invocation is `git` with exactly `clone`, the repository, and the destination, which detects a command assembled as one shell string.
 * @evidence contracts/testing.md#independent-expectations The expected invocation is the argument vector built from the test's own two strings, which an argument-vector spawn must pass through unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Hostile text in both the repository and the destination is the failing input; ordinary values are covered by the command sequence tests.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
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
