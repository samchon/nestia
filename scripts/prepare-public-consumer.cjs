const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const { createRequire } = require("node:module");
const path = require("node:path");
const yaml = require("yaml");

const ROOT = path.resolve(__dirname, "..");
const preparations = new Map();

/**
 * Installs one public consumer from the caller's built tarballs and lock graph.
 *
 * The owning integration command supplies its frozen-lock dependency owner
 * once before producer, generation,
 * runtime and worker connections share the same ordinary installed packages.
 * Each invocation packs current inputs at content-addressed file URLs; no
 * persistent success stamp can hide a changed package artifact.
 *
 * @evidence contracts/common.md#principled-implementation Published tarballs supply all eight package dependencies and overrides. Both published importer edges and registry snapshot edges supply exact parent/dependency overrides. The actual installed public-owner edges must match their caller resolutions, every registry version must belong to the frozen graph, and public entries must resolve inside the ordinary private install as JavaScript artifacts.
 * @evidence contracts/common.md#clear-and-simple-design One command-scoped promise per normalized dependency owner owns packing and installation, while callers receive the installed root and its normal require function. Compiler, generators and hosts retain their own lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported pnpm file dependencies and overrides replace no foreign resolver or module export. The installer does not rewrite a lockfile, build source packages or modify emitted JavaScript to resolve public imports.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller-built inputs, shared installation scope and the absence of a persistent skip stamp; preparation phases and failures remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native filesystem paths identify the repository and private root. File dependency URLs use forward slashes, and the caller's pnpm JavaScript entry is launched through process.execPath with argument arrays instead of platform shell quoting. Inherited NODE_PATH and NODE_OPTIONS are cleared only in owned plain-Node children.
 * @evidence contracts/performance.md#efficient-algorithms One normalized owner lookup in a Map avoids repeating its install request. The delegated installer owns linear lock-edge construction and installed-graph validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each promise shares preparation only for the same dependency owner inside this integration process against unchanged caller-built inputs. Every new process repacks and installs so changed tarballs and lock inputs are observed; different importers retain their exact dependencies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The process retains one promise and ordinary require function per requested owner. Current independent SDK and migration commands each request one owner; no historical snapshots survive a process. Awaited preparation retains no listener or worker.
 */
function preparePublicConsumer(owner) {
  const ownerRoot = path.resolve(ROOT, owner);
  const relative = path.relative(ROOT, ownerRoot);
  assert(relative && relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative), "Public consumer dependency owner must be inside the repository.");
  if (!preparations.has(ownerRoot))
    preparations.set(ownerRoot, installPublicConsumer(ownerRoot));
  return preparations.get(ownerRoot);
}

/**
 * Resolves current package inputs before one cache-preferring public
 * installation.
 *
 * Every published package overrides its transitive workspace references with
 * the same tarball. Parent-specific third-party overrides use resolved caller
 * versions, including npm aliases; conflicting peer-context edges reject.
 * Workspace-owned public dependencies come from their package importers because
 * they have no registry snapshot. The actual installed graph is checked before
 * any compiler or runtime starts, rather than trusting override construction. A
 * frozen caller installation can populate package contents without registry
 * metadata. Prefer the existing store while allowing missing metadata to
 * resolve normally; an offline-only install would reject an otherwise
 * provisioned CI.
 *
 * Packed bytes determine each file dependency address so pnpm invalidates a
 * changed artifact even when its package version is unchanged. After successful
 * graph validation, obsolete owned tarballs are released; failed preparation
 * retains its artifacts for diagnosis until a later successful preparation.
 * The preparation entry supplies the normalized, contained owner root.
 *
 * @evidence contracts/common.md#principled-implementation Exact importer versions and snapshot edges derive from the frozen caller lock; public file dependencies point at fresh built tarballs. Conflicting overrides reject, and actual public-owner edges/registry versions/runtime addresses are validated after installation.
 * @evidence contracts/common.md#clear-and-simple-design One owner supplies one manifest, packing phase, installation and validation. The result contains only the ordinary private root and its require function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Node createRequire and pnpm's supported file dependencies/overrides own resolution. Neither workspace manifests nor foreign loaders nor emitted JavaScript are altered; failed installation is not retried into success.
 * @evidence contracts/common.md#meaningful-documentation The comment explains importer/snapshot ownership, alias and conflict handling, and prefer-offline provisioning. Preparation logs identify its package population and total duration separately from compiler/runtime phases.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths identify inputs and installation roots; file dependency URLs use forward slashes. The caller's absolute pnpm JavaScript launcher runs through process.execPath with argument arrays and no shell.
 * @evidence contracts/performance.md#efficient-algorithms Override construction visits public-owner and registry edges once; installed validation uses map/set membership for edges, packages and public entries. Each tarball is hashed once with at most one archive held in memory; pnpm owns content-addressed store reuse.
 * @evidence contracts/performance.md#reuse-equivalent-work All phases use the same validated artifacts. SHA-256 addresses change with packed bytes, invalidating pnpm file dependencies without forcing unchanged registry or package installations. Each invocation resolves the current frozen graph.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Awaited children settle before exposing the root. After successful graph validation only current package archives remain in the owned tarball directory; failures retain artifacts for diagnosis until the next successful preparation. The ordinary pnpm store owns its own cache retention.
 */
async function installPublicConsumer(ownerRoot) {
  const CONSUMER = path.join(ownerRoot, ".tmp-public-consumer");
  const started = Date.now();
  const pnpm = process.env.npm_execpath;
  assert(
    pnpm && path.isAbsolute(pnpm),
    "Run the owning integration command through pnpm so its installed manager can prepare the consumer.",
  );
  await fs.mkdir(path.join(CONSUMER, "tarballs"), { recursive: true });
  const rootManifest = JSON.parse(
    await fs.readFile(path.join(ROOT, "package.json"), "utf8"),
  );
  const lock = yaml.parse(
    await fs.readFile(path.join(ROOT, "pnpm-lock.yaml"), "utf8"),
  );
  const importerName = path.relative(ROOT, ownerRoot).split(path.sep).join("/");
  const importer = lock.importers[importerName];
  assert(importer, `The integration dependency owner is absent from the caller lock: ${importerName}`);
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
  const publicDependencies = new Map();
  const currentTarballs = new Set();
  const packageDirectories = new Set();
  for (const directory of await fs.readdir(path.join(ROOT, "packages"), {
    withFileTypes: true,
  })) {
    if (!directory.isDirectory()) continue;
    packageDirectories.add(directory.name);
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "packages", directory.name, "package.json"),
        "utf8",
      ),
    );
    const packed = path.join(CONSUMER, "tarballs", `${directory.name}.tgz`);
    await runConsumerChild(
      process.execPath,
      [pnpm, "pack", "--out", packed],
      path.join(ROOT, "packages", directory.name),
    );
    const filename = publicTarballName(directory.name, await fs.readFile(packed));
    currentTarballs.add(filename);
    const addressed = path.join(CONSUMER, "tarballs", filename);
    await fs.rename(packed, addressed);
    const tarball = "file:" + addressed.split(path.sep).join("/");
    dependencies[manifest.name] = tarball;
    overrides[manifest.name] = tarball;
    publicNames.push(manifest.name);
    const owner = lock.importers[`packages/${directory.name}`];
    assert(owner, `Published dependency owner is absent: ${manifest.name}`);
    const expected = new Map();
    for (const name of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    })) {
      const record =
        owner.dependencies?.[name] ?? owner.optionalDependencies?.[name];
      assert(
        record,
        `Published dependency is absent from caller lock: ${manifest.name}>${name}`,
      );
      const version = record.version.split("(")[0];
      if (version.startsWith("link:") || version.startsWith("file:")) continue;
      overrides[`${manifest.name}@${manifest.version}>${name}`] = /^\d/.test(
        version,
      )
        ? version
        : `npm:${version}`;
      expected.set(name, version);
    }
    publicDependencies.set(manifest.name, expected);
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
  await runConsumerChild(
    process.execPath,
    [
      pnpm,
      "install",
      "--ignore-workspace",
      "--prefer-offline",
      "--no-frozen-lockfile",
    ],
    CONSUMER,
  );
  const installedLock = yaml.parse(
    await fs.readFile(path.join(CONSUMER, "pnpm-lock.yaml"), "utf8"),
  );
  const artifacts = new Set();
  for (const [name, expected] of publicDependencies) {
    const version = installedLock.importers["."].dependencies[name].version;
    artifacts.add(`${name}@${version.split("(")[0]}`);
    const snapshot = installedLock.snapshots[`${name}@${version}`];
    assert(snapshot, `Installed published dependency owner is absent: ${name}`);
    for (const [dependency, resolution] of expected) {
      const actual =
        snapshot.dependencies?.[dependency] ??
        snapshot.optionalDependencies?.[dependency];
      assert.equal(
        actual?.split("(")[0],
        resolution,
        `Installed published dependency changed: ${name}>${dependency}`,
      );
    }
  }
  for (const dependency of Object.keys(installedLock.packages)) {
    if (artifacts.has(dependency)) continue;
    assert(
      Object.hasOwn(lock.packages, dependency),
      `Public installation resolved outside the frozen caller graph: ${dependency}`,
    );
  }
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
  const tarballRoot = path.join(CONSUMER, "tarballs");
  for (const entry of await fs.readdir(tarballRoot, { withFileTypes: true })) {
    if (!entry.isFile() || currentTarballs.has(entry.name)) continue;
    const name = entry.name.replace(/(?:-[a-f0-9]{64})?\.tgz$/, "");
    if (name === entry.name || !packageDirectories.has(name)) continue;
    const target = path.resolve(tarballRoot, entry.name);
    assert.equal(path.dirname(target), tarballRoot, "Obsolete archive must remain inside its owned directory.");
    await fs.rm(target);
  }
  console.log(
    `Public consumer preparation: ${publicNames.length} installed package artifacts; ${Date.now() - started} ms`,
  );
  return { root: CONSUMER, requirePublic };
}

/**
 * Names a public archive by its packed bytes, independently of package version.
 *
 * Pnpm can retain a file dependency when its address is unchanged. A SHA-256
 * suffix makes changed built artifacts new dependencies while identical bytes
 * retain their address. The caller supplies a package directory basename.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 over the complete packed byte sequence supplies the artifact identity used in the ordinary file dependency address; unchanged version fields cannot mask changed contents.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation combines the caller's basename and one byte digest; packing, native paths and archive lifetimes remain with installation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The address uses archive contents rather than package-specific exceptions, timestamps, a success stamp or forced invalidation of unchanged dependencies.
 * @evidence contracts/common.md#meaningful-documentation The comment explains pnpm address reuse, byte identity and the caller-owned basename premise.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This pure operation returns a basename containing an ASCII digest; the installer owns native path resolution and file URLs.
 * @evidence contracts/performance.md#efficient-algorithms One SHA-256 scan costs linear time in archive bytes and constant digest state, with no filesystem read or additional archive copy in this operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal package basenames and byte sequences produce equal dependency addresses; any byte change changes the digest under the SHA-256 collision-resistance premise used by content-addressed stores.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This pure operation retains no archives or handles; the installer owns archive reclamation after successful validation.
 */
function publicTarballName(name, contents) {
  return `${name}-${createHash("sha256").update(contents).digest("hex")}.tgz`;
}

/**
 * Executes one owned plain-Node preparation process and preserves its failure.
 *
 * Workspace loader preloads and search paths must not mask public package
 * resolution. Other caller settings, including absolute compiler caches and the
 * selected Go toolchain, remain inherited.
 *
 * Preparation supplies the actual executable, argument array and native working directory.
 *
 * @evidence contracts/common.md#principled-implementation The actual command inherits caller settings except workspace loader/search-path overrides; launch errors, nonzero exit and signals reject instead of certifying partial preparation.
 * @evidence contracts/common.md#clear-and-simple-design One promise observes launch and settlement of one child with inherited diagnostics and no retry or replay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts spawn executes the real command; clearing loader variables removes workspace resolver contamination without replacing a foreign module operation or compiler.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies cleared loader settings, inherited cache/toolchain inputs and first-failure ownership. Failure diagnostics include executable, arguments, exit and signal.
 * @evidence contracts/portability.md#os-neutral-implementation Argument-array spawn uses a native absolute cwd and no shell; process.execPath launches the caller's same Node on Windows and POSIX.
 * @evidence contracts/performance.md#efficient-algorithms One spawn and constant-size event registration observe one command without output buffering or a polling loop; inherited standard streams carry diagnostics directly.
 * @evidence contracts/performance.md#reuse-equivalent-work The owning preparation promise shares each invocation; this process boundary runs each requested packing/install command exactly once and does not substitute a prior result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The promise settles at launch failure or child exit, and installation awaits settlement before its next phase. It retains no output buffers or worker; command cancellation is owned by the invoking integration process tree.
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

module.exports = { preparePublicConsumer, installPublicConsumer, publicTarballName, runConsumerChild };
