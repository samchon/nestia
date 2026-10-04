import assert from "assert/strict";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import path from "path";

/**
 * Verifies ordinary built dependency resolution and fresh artifact ownership.
 *
 * A built operation can still resolve a workspace dependency to TypeScript. An
 * artifact view must follow the manifest closure and published entry fields
 * without touching installed external dependencies or retaining stale output.
 *
 * 1. Author two built packages, a source-only alternative and an external
 *    dependency.
 * 2. Resolve the copied graph through ordinary Node and compare its result.
 * 3. Change caller build output and require a fresh view to observe it.
 * 4. Dispose both views and contrast missing runtime dependencies and unknown
 *    owners.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual prepareUnitArtifacts and ordinary createRequire resolve authored alpha to built beta and its linked external package, returning902. A subsequent changed beta build produces1002 in a new view while the first view retains its copied bytes. Disposal removes views and leaves the external package usable; missing required dependency and unknown owner reject.
 * @evidence contracts/testing.md#independent-expectations Authored module literals compute900+1+1 and then900+101+1; the source alternative intentionally throws. These independent inputs distinguish built resolution and changed artifact visibility without deriving expected results from preparation output.
 * @evidence contracts/testing.md#distinguishing-cases A cyclic manifest dependency closes once without changing the acyclic runtime calls. Workspace source exports contrast with published JavaScript exports; changed bytes contrast old and fresh views, and missing required external dependency/unknown requested package distinguish rejected preparation. External target remains callable after view disposal.
 * @evidence contracts/testing.md#execution-ownership This matching editor SSR unit supplies an owned authored filesystem layout to the actual artifact operation, executes plain JavaScript through Node resolution and cleans files in finally. It installs nothing, compiles nothing and starts no host or child process.
 */
export const test_editor_unit_artifact_graph = (): void => {
  const {
    prepareUnitArtifacts,
  }: {
    prepareUnitArtifacts: (
      names: string[],
      repository: string,
    ) => { root: string; dispose: () => void };
  } = require(
    path.resolve(process.cwd(), "../../config/testing/UnitArtifacts.ts"),
  );
  const parent = fs.realpathSync(os.tmpdir());
  const fixture = fs.mkdtempSync(path.join(parent, "nestia-unit-graph-"));
  const views: ReturnType<typeof prepareUnitArtifacts>[] = [];
  const write = (file: string, text: string) => {
    const destination = path.join(fixture, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, text);
  };
  try {
    for (const name of ["alpha", "beta"]) {
      write(
        `packages/${name}/package.json`,
        JSON.stringify({
          name: `@unit/${name}`,
          main: "src/index.ts",
          exports: { ".": "./src/index.ts" },
          publishConfig: {
            main: "lib/index.js",
            exports: { ".": "./lib/index.js" },
          },
          dependencies:
            name === "alpha"
              ? { "@unit/beta": "workspace:*" }
              : { "@unit/alpha": "workspace:*", "unit-external": "1" },
        }),
      );
      write(
        `packages/${name}/src/index.ts`,
        'throw Error("Source must not load");',
      );
    }
    write(
      "packages/alpha/lib/index.js",
      'module.exports = require("@unit/beta") + 1;',
    );
    const beta = 'module.exports = require("unit-external") + 1;';
    write("packages/beta/lib/index.js", beta);
    write(
      "packages/beta/node_modules/unit-external/package.json",
      '{"name":"unit-external","main":"index.js"}',
    );
    write(
      "packages/beta/node_modules/unit-external/index.js",
      "module.exports = 900;",
    );
    const first = prepareUnitArtifacts(["@unit/alpha"], fixture);
    views.push(first);
    assert.equal(
      createRequire(path.join(first.root, "package.json"))("@unit/alpha"),
      902,
    );
    write(
      "packages/beta/lib/index.js",
      'module.exports = require("unit-external") + 101;',
    );
    const second = prepareUnitArtifacts(["@unit/alpha"], fixture);
    views.push(second);
    assert.equal(
      createRequire(path.join(second.root, "package.json"))("@unit/alpha"),
      1002,
    );
    assert.equal(
      fs.readFileSync(
        path.join(first.root, "node_modules/@unit/beta/lib/index.js"),
        "utf8",
      ),
      beta,
    );
    for (const view of views) {
      view.dispose();
      assert.equal(fs.existsSync(view.root), false);
    }
    assert.equal(
      require(path.join(fixture, "packages/beta/node_modules/unit-external")),
      900,
    );
    assert.equal(
      fs.readFileSync(
        path.join(fixture, "packages/beta/node_modules/unit-external/index.js"),
        "utf8",
      ),
      "module.exports = 900;",
    );
    assert.throws(
      () => prepareUnitArtifacts(["@unit/unknown"], fixture),
      /Unknown workspace artifact/,
    );
    fs.renameSync(
      path.join(fixture, "packages/beta/node_modules/unit-external"),
      path.join(fixture, "external-retained"),
    );
    assert.throws(
      () => prepareUnitArtifacts(["@unit/alpha"], fixture),
      /Missing installed runtime dependency/,
    );
  } finally {
    for (const view of views) view.dispose();
    assert.equal(path.dirname(fixture), parent);
    assert(path.basename(fixture).startsWith("nestia-unit-graph-"));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
};
