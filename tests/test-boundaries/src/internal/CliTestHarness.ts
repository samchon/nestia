import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Local helpers for the `nestia start` / `nestia template` test suite.
 *
 * The suite spawns the real `bin/index.js` executable of `packages/cli` against
 * a local fixture git repository, so no network access is needed. The engine's
 * own decisions are unit-tested in `tests/test-unit`.
 */
export namespace CliTestHarness {
  /* -----------------------------------------------------------
    LOCATIONS
  ----------------------------------------------------------- */
  /** Ttsx relocates compiled sources, so anchor on the workspace cwd. */
  export const ROOT: string = path.resolve(process.cwd(), "..", "..");
  export const CLI_BIN: string = path.join(ROOT, "packages", "cli", "bin");
  export const CLI_MAIN: string = path.join(CLI_BIN, "index.js");

  /* -----------------------------------------------------------
    END TO END FIXTURES
  ----------------------------------------------------------- */
  export interface IFixture {
    /** Local git repository standing in for the template repository. */
    repository: string;
    /** Scaffold destination; does not exist until the CLI creates it. */
    dest: string;
    /** Best-effort removal of every temporary directory. */
    clean: () => void;
  }

  /**
   * Creates a local git repository shaped like a tiny pnpm monorepo whose root
   * `build` / `test` scripts drop `.built` / `.tested` marker files, so tests
   * can prove which lifecycle steps the CLI actually ran.
   */
  export const prepareFixture = (): IFixture => {
    const repository: string = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-cli-fixture-"),
    );
    const workspace: string = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-cli-scaffold-"),
    );
    write(
      repository,
      "package.json",
      JSON.stringify(
        {
          name: "nestia-cli-fixture",
          version: "0.0.1",
          private: true,
          scripts: {
            build: `node -e "require('fs').writeFileSync('.built','1')"`,
            test: `node -e "require('fs').writeFileSync('.tested','1')"`,
          },
        },
        null,
        2,
      ),
    );
    write(repository, "pnpm-workspace.yaml", `packages:\n  - "packages/*"\n`);
    write(
      repository,
      path.join("packages", "api", "package.json"),
      JSON.stringify(
        { name: "nestia-cli-fixture-api", version: "0.0.1", private: true },
        null,
        2,
      ),
    );
    write(
      repository,
      path.join(".github", "dependabot.yml"),
      "version: 2\nupdates: []\n",
    );

    const git = (...args: string[]): void =>
      void cp.execFileSync("git", args, { cwd: repository, stdio: "ignore" });
    git("init");
    git("add", ".");
    git(
      "-c",
      "user.name=nestia",
      "-c",
      "user.email=nestia@test",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      "fixture",
    );

    return {
      repository,
      dest: path.join(workspace, "project"),
      clean: () => {
        for (const directory of [repository, workspace])
          try {
            fs.rmSync(directory, {
              recursive: true,
              force: true,
              maxRetries: 4,
            });
          } catch {
            // temporary directories; leftovers are harmless
          }
      },
    };
  };

  /** Runs the real CLI executable (`packages/cli/bin/index.js`). */
  export const runCli = (args: string[]): void =>
    void cp.execFileSync(process.execPath, [CLI_MAIN, ...args], {
      stdio: "inherit",
    });

  const write = (root: string, file: string, content: string): void => {
    const location: string = path.join(root, file);
    fs.mkdirSync(path.dirname(location), { recursive: true });
    fs.writeFileSync(location, content, "utf8");
  };
}
