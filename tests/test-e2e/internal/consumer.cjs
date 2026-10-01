const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../../..");
const PACKAGES = ["fetcher", "e2e", "core", "sdk", "cli", "migrate", "benchmark", "editor"];
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const LAUNCHER = process.env.npm_execpath;
const USE_LAUNCHER =
  typeof LAUNCHER === "string" &&
  /^pnpm\.[cm]?js$/.test(path.basename(LAUNCHER));

const execute = (args, cwd, capture = false) =>
  new Promise((resolve, reject) => {
    const child = cp.spawn(
      USE_LAUNCHER ? process.execPath : PNPM,
      USE_LAUNCHER ? [LAUNCHER, ...args] : args,
      {
        cwd,
        shell: !USE_LAUNCHER && process.platform === "win32",
        windowsHide: true,
        env: { ...process.env, NODE_PATH: "" },
        stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
      },
    );
    const chunks = [];
    if (capture) child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) resolve(Buffer.concat(chunks).toString("utf8"));
      else
        reject(new Error(`pnpm ${args.join(" ")} failed: ${signal ?? code}`));
    });
  });

/**
 * Prepares one real packed installation for a boundary workspace's consumers.
 *
 * The caller supplies its workspace root, which owns dependency inventory,
 * temporary consumers and mounted feature directories.
 *
 * Workspace manifests serve sources, whereas published exports serve builds.
 * Actual tarballs preserve that boundary without rewriting global resolution.
 *
 * 1. Pack freshly built consumer packages and pin the installed test toolchain.
 * 2. Install once and give isolated feature trees access to those dependencies.
 * 3. Release the owned installation after every consuming process has ended.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual pnpm pack/install operations prepare the artifacts subsequently imported by CLI, compiler and runtime consumers; any failed preparation rejects the suite. Consumer assertions own specific generated/API behavior rather than accepting package-file arrangement as its substitute.
 * @evidence contracts/testing.md#independent-expectations Published manifests are produced by pnpm packing the freshly built package inputs; direct tool versions come from the caller's installed workspace, not a generated expected-output snapshot. This setup alone does not certify every export or API behavior.
 * @evidence contracts/testing.md#distinguishing-cases Packed package resolution replaces source workspace resolution for actual consumers. Each invocation owns a distinct installation and feature outputs; native option, wrapper, transport and invalidation distinctions remain with the consuming tests.
 * @evidence contracts/testing.md#execution-ownership The sole integrated E2E main awaits this exported preparation before consumers and close it in finally after their lifetimes. Canonical pnpm entries reuse their caller's JavaScript launcher; standalone Node calls fall back to PATH. It owns a necessary installation boundary, not a portable utility-unit population.
 * @evidence contracts/e2e.md#necessary-boundary Real tarballs and package-manager resolution establish that published exports, dependency declarations and linked native contributors connect in an installed consumer. A global resolver redirect cannot establish that contract.
 * @evidence contracts/e2e.md#shared-execution One installation supplies the rich producer, generated consumer and necessary CLI boundaries. Packages are packed once after the caller builds them, direct external tool versions are pinned, and native compiler caches remain outside the disposable installation for reuse.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique owned directory prevents concurrent invocations deleting each other's packages. Mounts supply dependencies through ordinary filesystem links while feature source/output trees remain isolated; only the registered installation root is removed after children settle, including preparation failure.
 * @evidence contracts/e2e.md#preserved-coverage Actual source/configuration, generated artifact, runtime, diagnostic and wrapper assertions remain in their consumer owners. This removes only global resolution overrides; it does not replace compilation or transport with installation success.
 */
const prepare = async (workspace) => {
  workspace = path.resolve(workspace);
  const directory = fs.mkdtempSync(path.join(workspace, ".tmp-consumer-"));
  const remove = () => {
    if (path.dirname(directory) !== workspace)
      throw new Error("Consumer installation escaped its owned workspace.");
    fs.rmSync(directory, { recursive: true, force: true, maxRetries: 3 });
  };
  try {
    const packs = path.join(directory, "packs");
    fs.mkdirSync(packs);
    const inventory = JSON.parse(
      await execute(
        [
          "--filter",
          "./" + path.relative(ROOT, workspace).split(path.sep).join("/"),
          "list",
          "--depth",
          "0",
          "--json",
        ],
        ROOT,
        true,
      ),
    );
    if (inventory.length !== 1)
      throw new Error("Expected exactly one consumer workspace toolchain inventory.");
    const dependencies = {};
    for (const [name, installed] of Object.entries({
      ...inventory[0].dependencies,
      ...inventory[0].devDependencies,
    })) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(installed.path, "package.json"), "utf8"),
      );
      dependencies[name] = manifest.version;
    }
    for (const name of PACKAGES) {
      const cwd = path.join(ROOT, "packages", name);
      const manifest = JSON.parse(
        fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
      );
      await execute(
        ["pack", "--out", path.relative(cwd, path.join(packs, `${name}.tgz`))],
        cwd,
      );
      dependencies[manifest.name] = `file:./packs/${name}.tgz`;
    }
    fs.writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify(
        {
          name: "nestia-integrated-installed-consumer",
          private: true,
          dependencies,
        },
        null,
        2,
      ),
    );
    await execute(
      ["install", "--ignore-workspace", "--prefer-offline", "--ignore-scripts"],
      directory,
    );
    const modules = path.join(directory, "node_modules");
    const mount = (cwd) => {
      const relative = path.relative(workspace, cwd);
      if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        !relative.split(path.sep).some((part) => part.startsWith(".tmp-"))
      )
        throw new Error(
          `Refusing to mount packages into an unowned tree: ${cwd}`,
        );
      const destination = path.join(cwd, "node_modules");
      fs.mkdirSync(destination, { recursive: true });
      for (const entry of fs.readdirSync(modules)) {
        const source = path.join(modules, entry);
        if (!fs.statSync(source).isDirectory()) continue;
        const target = path.join(destination, entry);
        try {
          fs.lstatSync(target);
          continue;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        fs.symlinkSync(
          source,
          target,
          process.platform === "win32" ? "junction" : "dir",
        );
      }
    };
    const binary = (name, key) => {
      const manifestFile = require.resolve(`${name}/package.json`, {
        paths: [directory],
      });
      const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
      const location =
        typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[key];
      if (location === undefined)
        throw new Error(`Missing installed ${name} binary: ${key}`);
      return path.resolve(path.dirname(manifestFile), location);
    };
    return { directory, mount, binary, close: remove };
  } catch (error) {
    remove();
    throw error;
  }
};

module.exports = { prepare };
