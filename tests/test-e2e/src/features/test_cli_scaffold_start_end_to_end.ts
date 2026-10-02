import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliBoundaryHarness } from "../internal/CliBoundaryHarness";

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
 * @evidence contracts/testing.md#behavioral-verification The built CLI start dispatch clones a local workspace, installs it and runs build and test.
 * @evidence contracts/testing.md#independent-expectations Fixture scripts independently emit distinct built and tested markers that witness real lifecycle commands.
 * @evidence contracts/testing.md#distinguishing-cases Start must preserve workspace configuration and both markers while removing git and dependabot metadata.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this real CLI or HTTP boundary by its test-prefixed export.
 * @evidence contracts/e2e.md#necessary-boundary The built CLI dispatcher must connect argument parsing to real git and pnpm lifecycle operations; injected engine unit cases cannot prove dispatcher wiring.
 * @evidence contracts/e2e.md#shared-execution Both command cases consume caller-built CLI artifacts and the same installed package manager. Their independent scaffold outputs are required because start runs tests and template must omit them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh repository and destination isolate clone mutations and lifecycle markers; the fixture cleanup executes in finally after command completion or failure.
 * @evidence contracts/e2e.md#preserved-coverage The original build/test markers, repository-metadata removal and command-specific assertions remain in this relocated test; engine option and failure semantics remain in test-cli units.
 */

export const test_cli_scaffold_start_end_to_end = async (): Promise<void> => {
  const fixture: CliBoundaryHarness.IFixture =
    CliBoundaryHarness.prepareFixture();
  try {
    CliBoundaryHarness.runCli([
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
