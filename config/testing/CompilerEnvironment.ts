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
  const pnpm = process.env.npm_execpath;
  if (!pnpm || !path.isAbsolute(pnpm))
    throw new Error("Run Go units through the installed pnpm manager.");
  const result = cp.spawnSync(
    process.execPath,
    [
      pnpm,
      "--filter=@nestia/core",
      "--filter=@nestia/sdk",
      "-r",
      "--no-bail",
      "run",
      "test:go",
    ],
    {
      cwd: path.resolve(__dirname, "../.."),
      env: resolveTestEnvironment(
        path.resolve(__dirname, "../.."),
        process.env,
      ),
      stdio: "inherit",
    },
  );
  if (result.error) console.error(result.error);
  process.exitCode = Number.isInteger(result.status) ? result.status : 2;
}
