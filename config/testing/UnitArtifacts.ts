import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

/**
 * Assembles a closed graph of caller-built workspace artifacts for units.
 *
 * Workspace exports intentionally point at TypeScript source. A built library's
 * bare dependency would otherwise re-enter source compilation under a language
 * loader. This filesystem view copies unchanged build output, applies the
 * package's published resolution fields and links its exact installed external
 * dependencies. It is unit artifact preparation, not a public-install oracle.
 *
 * @evidence contracts/common.md#principled-implementation The dependency closure follows actual workspace manifest names and dependency edges. Each package retains unchanged lib/bin/dist bytes and published main/types/module/exports/bin fields; normal Node resolution finds internal copied packages and exact installed external dependency directories without loading workspace source.
 * @evidence contracts/common.md#clear-and-simple-design One operation discovers the requested workspace closure and assembles an ordinary node_modules layout. The caller owns the returned temporary root and disposer; no dependency resolver hook is installed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This copies caller-built input without editing JavaScript, replacing foreign methods, installing packages or adding production injection. Published resolution fields come from package metadata rather than fixture-specific output substitutions. Actual packed-consumer installation remains a separate integration owner.
 * @evidence contracts/common.md#meaningful-documentation The comment explains workspace-source re-entry, artifact/external dependency ownership and the distinction from public installation evidence.
 * @evidence contracts/portability.md#os-neutral-implementation Native path operations construct package locations and a unique OS temporary root. Windows junctions and POSIX directory symlinks point at existing external dependency directories. Disposal checks the exact owned temporary parent and prefix before removing the view, unlinking external links rather than their targets.
 * @evidence contracts/performance.md#efficient-algorithms Manifest discovery and dependency closure visit each workspace package and dependency once. Each selected build tree is copied once; cost is linear in its output bytes and external links, with no compiler or installation.
 * @evidence contracts/performance.md#reuse-equivalent-work One fresh view belongs to an invocation's caller-built snapshot and can serve isolated child unit processes through its absolute root. No persistent success stamp reuses an earlier invocation; copied bytes isolate the current run from later build output changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives one view and disposer, invoked after all users settle. Partial preparation removes the same owned root before rethrowing; links retain no process or filesystem handles and shared installed dependencies are never removed.
 */
export function prepareUnitArtifacts(
  names: readonly string[],
  repository = path.resolve(__dirname, "../.."),
) {
  const packages = new Map();
  for (const directory of fs.readdirSync(path.join(repository, "packages"))) {
    const source = path.join(repository, "packages", directory);
    const file = path.join(source, "package.json");
    if (!fs.existsSync(file)) continue;
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    packages.set(manifest.name, { source, manifest });
  }
  const selected = new Set<string>();
  const pending = [...names];
  for (let index = 0; index < pending.length; ++index) {
    const name = pending[index];
    assert(name !== undefined);
    if (selected.has(name)) continue;
    const owner = packages.get(name);
    assert(owner, `Unknown workspace artifact: ${name}`);
    selected.add(name);
    for (const dependency of Object.keys({
      ...owner.manifest.dependencies,
      ...owner.manifest.optionalDependencies,
      ...owner.manifest.peerDependencies,
    }))
      if (packages.has(dependency)) pending.push(dependency);
  }
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, "nestia-unit-artifacts-"));
  const dispose = () => {
    assert.equal(path.dirname(root), parent);
    assert(path.basename(root).startsWith("nestia-unit-artifacts-"));
    fs.rmSync(root, { recursive: true, force: true });
  };
  try {
    fs.writeFileSync(path.join(root, "package.json"), '{"private":true}');
    for (const name of selected) {
      const { source, manifest } = packages.get(name);
      const target = path.join(root, "node_modules", ...name.split("/"));
      const relative = path.relative(path.join(root, "node_modules"), target);
      assert(
        relative &&
          relative !== ".." &&
          !relative.startsWith(".." + path.sep) &&
          !path.isAbsolute(relative),
        `Invalid package artifact identity: ${name}`,
      );
      fs.mkdirSync(target, { recursive: true });
      let outputs = 0;
      for (const directory of ["lib", "bin", "dist"]) {
        const input = path.join(source, directory);
        if (!fs.existsSync(input)) continue;
        fs.cpSync(input, path.join(target, directory), { recursive: true });
        ++outputs;
      }
      assert(outputs > 0, `Build the caller artifact before units: ${name}`);
      const published = { ...manifest };
      for (const field of ["main", "types", "module", "exports", "bin"])
        if (manifest.publishConfig?.[field] !== undefined)
          published[field] = manifest.publishConfig[field];
      fs.writeFileSync(
        path.join(target, "package.json"),
        JSON.stringify(published),
      );
      for (const dependency of Object.keys({
        ...manifest.dependencies,
        ...manifest.optionalDependencies,
        ...manifest.peerDependencies,
        ...manifest.devDependencies,
      })) {
        if (selected.has(dependency)) continue;
        const installed = path.join(
          source,
          "node_modules",
          ...dependency.split("/"),
        );
        if (!fs.existsSync(installed)) {
          assert(
            manifest.dependencies?.[dependency] === undefined,
            `Missing installed runtime dependency: ${name}>${dependency}`,
          );
          continue;
        }
        const link = path.join(
          target,
          "node_modules",
          ...dependency.split("/"),
        );
        fs.mkdirSync(path.dirname(link), { recursive: true });
        fs.symlinkSync(
          fs.realpathSync(installed),
          link,
          process.platform === "win32" ? "junction" : "dir",
        );
      }
    }
    const requireArtifact = createRequire(path.join(root, "package.json"));
    for (const name of selected) {
      const entry = requireArtifact.resolve(name);
      assert(
        [".js", ".mjs", ".cjs"].includes(path.extname(entry)),
        `Unit artifact resolves to source instead of built JavaScript: ${name}`,
      );
    }
    return { root, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
