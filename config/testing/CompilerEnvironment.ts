import cp from "node:child_process";
import path from "node:path";

/**
 * Resolves test-owned compiler caches before a child changes workspace.
 *
 * Ttsc defaults its Go objects below the native binary cache, whereas an
 * ordinary go command otherwise selects the user's system cache. Canonical
 * tests align those defaults and retain explicit caller-owned Go settings.
 *
 * @evidence contracts/common.md#principled-implementation The compiler cache and explicit ttsc Go-cache override are resolved against the repository root once. An explicit GOCACHE remains unchanged; absent that override, Go units use the selected ttsc Go cache or its normal go-build child, matching the installed ttsc default and precedence.
 * @evidence contracts/common.md#clear-and-simple-design One pure environment operation owns default alignment and path anchoring. Native execution consumes the returned environment without changing caller inputs or product resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation sets ordinary documented environment values and never patches a compiler, Go command, resolver or cache key. Caller toolchain and explicit GOCACHE settings are retained.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why the two tools otherwise choose different object caches and which explicit settings retain their own ownership.
 * @evidence contracts/portability.md#os-neutral-implementation Native node:path resolution anchors repository-relative ttsc paths before workspace changes. Explicit GOCACHE is passed through according to Go's own environment contract rather than interpreting special values as paths.
 * @evidence contracts/performance.md#efficient-algorithms A shallow environment copy and constant path resolutions cost O(environment entries), independent of fixture or test count; no filesystem scan or compiler process occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Default Go unit and source-plugin builds select the same object-cache root. Go retains compiler/input identity and invalidation ownership, so matching toolchains reuse equivalent objects and differing toolchains cannot reuse incompatible entries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned environment is owned by the caller for one plan. No cache is deleted and no directory, file handle, process or global environment mutation is created here.
 */
export function resolveTestEnvironment(
  root: string,
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv & { TTSC_CACHE_DIR: string; GOCACHE: string } {
  const cache = path.resolve(
    root,
    environment.TTSC_CACHE_DIR || "node_modules/.cache/ttsc",
  );
  const goCache = environment.TTSC_GO_CACHE_DIR
    ? path.resolve(root, environment.TTSC_GO_CACHE_DIR)
    : undefined;
  return {
    ...environment,
    TTSC_CACHE_DIR: cache,
    ...(goCache ? { TTSC_GO_CACHE_DIR: goCache } : {}),
    GOCACHE: environment.GOCACHE || goCache || path.join(cache, "go-build"),
  };
}

if (require.main === module || process.argv[1] === __filename) {
  const root = path.resolve(__dirname, "../..");
  const target71 = process.argv.includes("--typescript-7-1");
  const race = process.argv.includes("--race");
  const selected = process.argv
    .find((arg) => arg.startsWith("--package="))
    ?.slice(10);
  if (selected && selected !== "core" && selected !== "sdk")
    throw new Error(`Unknown Go test package: ${selected}`);
  let status = 0;
  for (const owner of selected ? [selected] : ["core", "sdk"]) {
    const environment = resolveTestEnvironment(root, process.env);
    if (target71) {
      environment.GOWORK = path.join(
        root,
        "packages",
        owner,
        "test",
        "go.7.1.work",
      );
      environment.GOFLAGS = [environment.GOFLAGS, "-tags=ttsc_typescript_7_1"]
        .filter(Boolean)
        .join(" ");
    }
    // Private per-file transformer access requires one same-package test.
    // Keep the ordinary external units and this exception in canonical runs.
    const modules = race
      ? owner === "core"
        ? ["native"]
        : []
      : owner === "core"
        ? ["test", "native"]
        : ["test"];
    for (const module of modules) {
      const args = [
        "test",
        "-count=1",
        ...(race
          ? ["-race", "-run", "^TestDistinctProgramsConcurrentEmit$"]
          : []),
        module === "native" ? "./transform" : "./...",
      ];
      console.log(
        `Go ${target71 ? "7.1" : "7.0"} ${owner}/${module}: go ${args.join(" ")}`,
      );
      const result = cp.spawnSync("go", args, {
        cwd: path.join(root, "packages", owner, module),
        env: environment,
        stdio: "inherit",
      });
      if (result.error) console.error(result.error);
      if (result.status !== 0)
        status = Number.isInteger(result.status) ? result.status! : 2;
    }
  }
  process.exitCode = status;
}
