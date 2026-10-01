import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the real `nestia start` executable scaffolds a pnpm monorepo
 * end-to-end.
 *
 * Unit tests fake every side effect, so only this test proves the built
 * `bin/index.js` wires the engine correctly: a real `git clone`, a real `pnpm
 * install` against a `pnpm-workspace.yaml` project (npm would reject the
 * workspace protocol family outright), real build/test script execution, and
 * real removal of the repository-only files. The `--repository` override keeps
 * it network-free.
 *
 * 1. Create a local fixture git repository shaped like a tiny pnpm monorepo whose
 *    build/test scripts drop `.built` / `.tested` marker files.
 * 2. Run `node packages/cli/bin/index.js start <dest> --repository <fixture>`.
 * 3. Assert the destination exists with both markers present.
 * 4. Assert `.git` and `.github/dependabot.yml` were removed.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `nestia start <dest> --repository <fixture>` as a child process and asserts the destination exists with the `.built` and `.tested` markers, and that `.git` and `.github/dependabot.yml` are gone.
 * @evidence contracts/testing.md#independent-expectations The markers are dropped by the fixture's own scripts, so their presence is evidence from the fixture repository that install, build, and test really ran, not from the CLI's report.
 * @evidence contracts/testing.md#distinguishing-cases The fixture has both a build and a test script, so the test marker separates the starter from `nestia template`, which stops after the build.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-cli` suite, discovered by `DynamicExecutor` under `src/features`) and executes the real `packages/cli/bin/index.js` in a child process with a real `git clone` and a real `pnpm install`; the engine's own decisions are unit-tested in `tests/test-unit`.
 * @evidence contracts/e2e.md#necessary-boundary The fake-context unit tests prove the command sequence, but only a real child process proves the built `bin/index.js` wires the engine, that `git clone` and `pnpm install` work against a `pnpm-workspace.yaml` project, and that the repository-only files are really removed.
 * @evidence contracts/e2e.md#shared-execution The suite installs nothing beyond the fixture's own empty workspace; each scaffold clones a tiny local repository, so the only real preparation is one `git init` and one `pnpm install` of a package with no dependencies per test.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each test creates its own temporary repository and destination directories with `mkdtemp` and removes them in a `finally`, because a scaffold writes into its destination and the two commands must not see each other's `.built` markers.
 * @evidence contracts/e2e.md#preserved-coverage The command sequences that were unit-tested stay in `tests/test-unit`; this case keeps the one assertion they cannot make, that the executable really performs the sequence.
 */
export const test_cli_scaffold_start_end_to_end = async (): Promise<void> => {
  const fixture: CliTestHarness.IFixture = CliTestHarness.prepareFixture();
  try {
    CliTestHarness.runCli([
      "start",
      fixture.dest,
      "--repository",
      fixture.repository,
    ]);

    const exists = (...segments: string[]): boolean =>
      fs.existsSync(path.join(fixture.dest, ...segments));
    TestValidator.predicate("dest", fs.existsSync(fixture.dest));
    TestValidator.predicate("workspace", exists("pnpm-workspace.yaml"));
    TestValidator.predicate("build marker", exists(".built"));
    TestValidator.predicate("test marker", exists(".tested"));
    TestValidator.predicate("no .git", exists(".git") === false);
    TestValidator.predicate(
      "no dependabot",
      exists(".github", "dependabot.yml") === false,
    );
  } finally {
    fixture.clean();
  }
};
