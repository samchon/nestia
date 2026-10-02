const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const { createRequire } = require("node:module");
const path = require("node:path");
const yaml = require("yaml");

const ROOT = path.resolve(__dirname, "../..");
const CONSUMER = path.join(__dirname, ".tmp-public-consumer");
let preparation;

/**
 * Installs one public consumer from the caller's built tarballs and lock graph.
 *
 * The owning integration command calls this once before producer, generation,
 * runtime and worker connections share the same ordinary installed packages.
 * Each invocation of that command repacks and installs current inputs; no
 * persistent success stamp can hide a changed package artifact.
 *
 * @evidence contracts/common.md#principled-implementation Published tarballs supply all eight package dependencies and overrides. Actual resolved caller lock versions and parent/dependency overrides preserve third-party dependency relationships in an ordinary private pnpm installation; public resolution must stay inside that install and select JavaScript artifacts.
 * @evidence contracts/common.md#clear-and-simple-design One command-scoped promise owns packing and installation, while callers receive the installed root and its normal require function. Compiler, generators and hosts retain their own lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported pnpm file dependencies and overrides replace no foreign resolver or module export. The installer does not rewrite a lockfile, build source packages or modify emitted JavaScript to resolve public imports.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller-built inputs, shared installation scope and the absence of a persistent skip stamp; preparation phases and failures remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native filesystem paths identify the repository and private root. File dependency URLs use forward slashes, and the caller's pnpm JavaScript entry is launched through process.execPath with argument arrays instead of platform shell quoting. Inherited NODE_PATH and NODE_OPTIONS are cleared only in owned plain-Node children.
 * @evidence contracts/performance.md#efficient-algorithms Lock parsing and override construction visit each resolved dependency edge once; ordinary pnpm owns installation and content-addressed store reuse.
 * @evidence contracts/performance.md#reuse-equivalent-work The promise shares one preparation only inside this integration process against its unchanged caller-built snapshot. Every new process repacks and invokes pnpm so changed tarballs and lock inputs are observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The process retains one promise, the private installation path and its require function. Each child is awaited and rejected on failure; no listener or worker is retained by installation. Generated consumers live in the ignored assignment root.
 */
function preparePublicConsumer() {
  return (preparation ??= installPublicConsumer());
}

/**
 * Resolves current package inputs before one offline public installation.
 *
 * Every published package overrides its transitive workspace references with
 * the same tarball. Parent-specific third-party overrides use resolved caller
 * versions, including npm aliases; conflicting peer-context edges reject.
 *
 * Principled implementation: Exact importer versions and snapshot dependency
 * edges derive from the frozen caller lock; file dependencies point at freshly
 * packed artifacts. Conflicting overrides reject instead of guessing which
 * peer-context relationship is correct. clear and simple design: The operation
 * constructs one manifest, packs once, installs once and validates ordinary
 * package resolution before exposing the consumer. prohibited implementation
 * shortcuts: All package resolution occurs through Node createRequire rooted at
 * the private manifest. No workspace manifest or foreign loader is altered and
 * installation failure is not retried into a pass. meaningful documentation:
 * The comment explains dependency ownership, alias handling and the
 * conflicting-edge failure; logs distinguish packing and installation from
 * later compiler and runtime phases.
 */
async function installPublicConsumer() {
  const started = Date.now();
  const rootManifest = JSON.parse(
    await fs.readFile(path.join(ROOT, "package.json"), "utf8"),
  );
  const lock = yaml.parse(
    await fs.readFile(path.join(ROOT, "pnpm-lock.yaml"), "utf8"),
  );
  const importer = lock.importers["tests/test-sdk"];
  assert(importer, "The SDK dependency owner is absent from the caller lock.");
  const dependencies = {};
  const overrides = {};
  for (const [name, record] of Object.entries({
    ...importer.dependencies,
    ...importer.devDependencies,
  })) {
    if (record.version.startsWith("link:")) continue;
    dependencies[name] = record.version.split("(")[0];
  }
  const publicNames = [];
  for (const directory of await fs.readdir(path.join(ROOT, "packages"), {
    withFileTypes: true,
  })) {
    if (!directory.isDirectory()) continue;
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "packages", directory.name, "package.json"),
        "utf8",
      ),
    );
    const tarball =
      "file:" +
      path
        .join(ROOT, "deploy/tarballs", `${directory.name}.tgz`)
        .split(path.sep)
        .join("/");
    dependencies[manifest.name] = tarball;
    overrides[manifest.name] = tarball;
    publicNames.push(manifest.name);
  }
  for (const [snapshot, record] of Object.entries(lock.snapshots)) {
    const parent = snapshot.split("(")[0];
    for (const [name, resolution] of Object.entries({
      ...record.dependencies,
      ...record.optionalDependencies,
    })) {
      const version = resolution.split("(")[0];
      if (version.startsWith("link:") || version.startsWith("file:")) continue;
      const selector = `${parent}>${name}`;
      const value = /^\d/.test(version) ? version : `npm:${version}`;
      assert(
        overrides[selector] === undefined || overrides[selector] === value,
        `Conflicting caller lock relationship: ${selector}`,
      );
      overrides[selector] = value;
    }
  }
  await runConsumerChild(
    process.execPath,
    [path.join(ROOT, "deploy/tarballs/index.js")],
    ROOT,
  );
  await fs.mkdir(CONSUMER, { recursive: true });
  await fs.writeFile(
    path.join(CONSUMER, "package.json"),
    JSON.stringify(
      {
        name: "nestia-integration-consumer",
        private: true,
        version: "0.0.0",
        packageManager: rootManifest.packageManager,
        dependencies,
        pnpm: { overrides },
      },
      null,
      2,
    ),
  );
  const pnpm = process.env.npm_execpath;
  assert(
    pnpm && path.isAbsolute(pnpm),
    "Run the owning integration command through pnpm so its installed manager can prepare the consumer.",
  );
  await runConsumerChild(
    process.execPath,
    [
      pnpm,
      "install",
      "--ignore-workspace",
      "--offline",
      "--no-frozen-lockfile",
    ],
    CONSUMER,
  );
  const requirePublic = createRequire(path.join(CONSUMER, "package.json"));
  for (const name of publicNames) {
    const entry = requirePublic.resolve(name);
    const relative = path.relative(CONSUMER, entry);
    assert(
      relative &&
        relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative),
      `${name} escaped public installation: ${entry}`,
    );
    assert(
      /\.(?:c|m)?js$/.test(entry),
      `${name} did not select its published JavaScript entry: ${entry}`,
    );
  }
  console.log(
    `Public consumer preparation: ${publicNames.length} installed package artifacts; ${Date.now() - started} ms`,
  );
  return { root: CONSUMER, requirePublic };
}

/**
 * Executes one owned plain-Node preparation process and preserves its failure.
 *
 * Workspace loader preloads and search paths must not mask public package
 * resolution. Other caller settings, including absolute compiler caches and the
 * selected Go toolchain, remain inherited.
 *
 * Principled implementation: An argument-array child inherits ordinary
 * environment settings except workspace loader/search-path overrides, streams
 * diagnostics and rejects nonzero exit or process-start failure. clear and
 * simple design: One promise observes launch and exit for one child, without
 * retry or diagnostic replay. prohibited implementation shortcuts: The child
 * runs the actual command with inherited standard settings; clearing loader
 * variables removes workspace resolver contamination rather than changing a
 * public module operation. meaningful documentation: The comment identifies the
 * removed loader settings, inherited cache/toolchain inputs and first-failure
 * ownership. os neutral implementation: spawn receives an executable and
 * argument array without a shell, with cwd represented by a native absolute
 * path; process.execPath launches the same Node on Windows and POSIX.
 */
function runConsumerChild(executable, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
    });
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Public consumer preparation failed: ${executable} ${args.join(" ")} (exit ${code}, signal ${signal}).`,
            ),
          ),
    );
  });
}

module.exports = { preparePublicConsumer };
