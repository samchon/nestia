const assert = require("node:assert/strict");
const path = require("node:path");
const {
  resolveTestEnvironment,
} = require("../../../../config/testing/CompilerEnvironment.ts");

/**
 * Verifies Go units and ttsc share defaults without replacing caller caches.
 *
 * Resolving only TTSC_CACHE_DIR left direct Go units using a different system
 * object cache. Relative ttsc paths must also survive child workspace changes.
 *
 * 1. Resolve default, relative and absolute native/Go cache settings.
 * 2. Require aligned defaults and literal preservation of explicit GOCACHE.
 * 3. Require unrelated environment values and caller objects to stay intact.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual environment resolution must align absent Go settings with the compiler cache, root-anchor relative ttsc overrides and retain explicit GOCACHE even alongside a different plugin-only Go override.
 * @evidence contracts/testing.md#independent-expectations Expected cache roots follow the installed ttsc default go-build child and its TTSC_GO_CACHE_DIR precedence; explicit GOCACHE values remain the caller's Go contract, including the literal off value.
 * @evidence contracts/testing.md#distinguishing-cases Default and empty settings, relative and absolute TTSC paths, plugin-only Go override, explicit Go cache with and without a distinct plugin override, special off and unrelated toolchain/environment values distinguish alignment from indiscriminate overwriting or cwd-dependent paths.
 * @evidence contracts/testing.md#execution-ownership This matching TypeScript unit directly calls the pure environment owner with frozen authored inputs. It installs or compiles nothing, reads no filesystem and starts no process or host.
 */
export function test_resolve_test_environment(): void {
  const root = path.resolve("authored-root");
  const binary = path.join(root, "compiler-cache");
  const pluginGo = path.join(root, "plugin-go-cache");
  const explicitGo = path.join(root, "caller-go-cache");
  const defaults = resolveTestEnvironment(
    root,
    Object.freeze({ TTSC_GO_BINARY: "caller-go", CUSTOM: "retained" }),
  );
  assert.equal(
    defaults.TTSC_CACHE_DIR,
    path.join(root, "node_modules", ".cache", "ttsc"),
  );
  assert.equal(
    defaults.GOCACHE,
    path.join(defaults.TTSC_CACHE_DIR, "go-build"),
  );
  assert.equal(defaults.TTSC_GO_BINARY, "caller-go");
  assert.equal(defaults.CUSTOM, "retained");
  const empty = resolveTestEnvironment(
    root,
    Object.freeze({ TTSC_CACHE_DIR: "", TTSC_GO_CACHE_DIR: "", GOCACHE: "" }),
  );
  assert.equal(empty.TTSC_CACHE_DIR, defaults.TTSC_CACHE_DIR);
  assert.equal(empty.GOCACHE, defaults.GOCACHE);
  for (const native of ["compiler-cache", binary]) {
    const input = Object.freeze({ TTSC_CACHE_DIR: native });
    const result = resolveTestEnvironment(root, input);
    assert.equal(result.TTSC_CACHE_DIR, binary);
    assert.equal(result.GOCACHE, path.join(binary, "go-build"));
    assert.equal(input.TTSC_CACHE_DIR, native);
    for (const plugin of ["plugin-go-cache", pluginGo]) {
      const override = resolveTestEnvironment(
        root,
        Object.freeze({ ...input, TTSC_GO_CACHE_DIR: plugin }),
      );
      assert.equal(override.TTSC_GO_CACHE_DIR, pluginGo);
      assert.equal(override.GOCACHE, pluginGo);
    }
  }
  for (const explicit of [explicitGo, "off", "caller-relative-cache"]) {
    const input = Object.freeze({
      TTSC_CACHE_DIR: "compiler-cache",
      TTSC_GO_CACHE_DIR: "plugin-go-cache",
      GOCACHE: explicit,
    });
    const result = resolveTestEnvironment(root, input);
    assert.equal(result.GOCACHE, explicit);
    assert.equal(result.TTSC_GO_CACHE_DIR, pluginGo);
    assert.equal(input.TTSC_GO_CACHE_DIR, "plugin-go-cache");
    assert.equal(
      resolveTestEnvironment(root, Object.freeze({ GOCACHE: explicit }))
        .GOCACHE,
      explicit,
    );
  }
}
