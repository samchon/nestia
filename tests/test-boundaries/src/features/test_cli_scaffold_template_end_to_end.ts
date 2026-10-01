import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the real `nestia template` executable scaffolds a pnpm monorepo
 * without running its test suite.
 *
 * The template command shares the starter's engine but must stop after the
 * build step — the backend template's test suite expects databases and other
 * infrastructure a fresh clone does not have. Only a real CLI run proves the
 * dispatcher maps `template` onto the no-test configuration.
 *
 * 1. Create a local fixture git repository whose build/test scripts drop `.built`
 *    / `.tested` marker files.
 * 2. Run `node packages/cli/bin/index.js template <dest> --repository <fixture>`.
 * 3. Assert the build marker exists but the test marker does not.
 * 4. Assert `.git` and `.github/dependabot.yml` were removed.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `nestia template <dest> --repository <fixture>` as a child process and asserts the build marker exists, the test marker does not, and the repository-only files are removed.
 * @evidence contracts/testing.md#independent-expectations The absent `.tested` marker is evidence from the fixture that the test script never ran, independent of what the CLI prints.
 * @evidence contracts/testing.md#distinguishing-cases The same fixture as the starter's case, so the missing test marker is the single difference that separates the template command from the start command.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-boundaries` suite, discovered by `DynamicExecutor` under `src/features`) and executes the real `packages/cli/bin/index.js` in a child process with a real `git clone` and a real `pnpm install`; the engine's own decisions are unit-tested in `tests/test-unit`.
 * @evidence contracts/e2e.md#necessary-boundary Only a real run shows that the dispatcher maps `template` onto the no-test configuration of the shared engine; the unit test checks the recorded commands, not the real dispatcher.
 * @evidence contracts/e2e.md#shared-execution It shares the fixture design of the starter's case but not its fixture: each scaffold has its own repository and destination, so two `git init` and two `pnpm install` runs of an empty package are the whole cost.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Its own temporary directories are created per test and removed in a `finally`, so the starter's markers cannot make this test pass.
 * @evidence contracts/e2e.md#preserved-coverage The template's clone URL and the absence of `pnpm run test` remain asserted by the unit test `test_cli_template_command_sequence`; this case keeps the real-dispatcher assertion.
 */
export const test_cli_scaffold_template_end_to_end =
  async (): Promise<void> => {
    const fixture: CliTestHarness.IFixture = CliTestHarness.prepareFixture();
    try {
      CliTestHarness.runCli([
        "template",
        fixture.dest,
        "--repository",
        fixture.repository,
      ]);

      const exists = (...segments: string[]): boolean =>
        fs.existsSync(path.join(fixture.dest, ...segments));
      TestValidator.predicate("dest", fs.existsSync(fixture.dest));
      TestValidator.predicate("build marker", exists(".built"));
      TestValidator.predicate("no test marker", exists(".tested") === false);
      TestValidator.predicate("no .git", exists(".git") === false);
      TestValidator.predicate(
        "no dependabot",
        exists(".github", "dependabot.yml") === false,
      );
    } finally {
      fixture.clean();
    }
  };
