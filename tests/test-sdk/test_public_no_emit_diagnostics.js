const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { runPublicCompilerCli } = require("./PublicCompiler");

/**
 * Verifies no-emit CLI forwarding preserves both output suppression and
 * analysis.
 *
 * An invalid LLM input fails with or without emit, so that negative alone
 * cannot detect a dropped flag. A valid scalar program distinguishes output
 * suppression without another Nest project load; the original invalid
 * controller proves native analysis is still executed rather than skipped on
 * no-emit builds.
 *
 * 1. Run the original WeakMap controller with the CLI no-emit flag.
 * 2. Run an authored valid scalar with config noEmit:false and the same flag.
 * 3. Retain both first results and require exact diagnostics or clean no-output.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual installed CLI rejects the original LLM WeakMap with its exact route location and both unsupported-type phrases, while a valid scalar exits zero and emits nothing despite config noEmit:false.
 * @evidence contracts/testing.md#independent-expectations The LLM schema contract rejects WeakMap; TypeScript accepts an exported numeric constant. CLI noEmit must override configured emit without disabling analysis, establishing independently different success and diagnostic outcomes.
 * @evidence contracts/testing.md#distinguishing-cases The valid no-plugin input detects a dropped noEmit flag by forbidden output. The original native invalid input detects skipped analysis by missing failure and diagnostics. Configured noEmit:false prevents a false pass from inheriting the repository's analysis-only default.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP runner calls this matching boundary once. Two necessary completed CLI requests reuse the installed graph/cache; Go units own all strict-rule and native no-emit entry semantics in-process.
 * @evidence contracts/e2e.md#necessary-boundary Installed CLI argument forwarding, plugin discovery and native diagnostics must agree. Direct Go dispatch cannot establish JavaScript wrapper forwarding, and an invalid native input alone cannot establish output suppression.
 * @evidence contracts/e2e.md#shared-execution Both controls share all packed artifacts and compiler cache. Only the original invalid controller loads the native product host; the minimal valid scalar disables product plugins and tests generic CLI forwarding without a second Nest program.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct projects under one containment-checked private root keep incompatible success/error inputs independent. Each command settles before assertions; finally removes only the owned root and retains shared artifacts/cache.
 * @evidence contracts/e2e.md#preserved-coverage All original CLI WeakMap status, exact source location, two diagnostic phrases and absent-output assertions remain. The valid control strengthens their inability to distinguish ignored noEmit, while Go units retain the transferred option matrix.
 */
function test_public_no_emit_diagnostics(consumer, cache) {
  const root = path.join(consumer.root, "projects/no-emit");
  const relative = path.relative(consumer.root, root);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(root, { recursive: true, force: true });
  const failures = [];
  try {
    for (const native of [true, false]) {
      const name = native ? "llm" : "valid";
      const fixture = path.join(root, name);
      try {
        fs.mkdirSync(path.join(fixture, "src"), { recursive: true });
        if (native)
          fs.copyFileSync(
            path.join(__dirname, "fixtures/llm-no-emit/llm-route.ts"),
            path.join(fixture, "src/llm-route.ts"),
          );
        else
          fs.writeFileSync(
            path.join(fixture, "src/value.ts"),
            "export const value: number = 1;\n",
          );
        fs.writeFileSync(
          path.join(fixture, "tsconfig.json"),
          JSON.stringify(
            {
              extends: path.resolve(__dirname, "../config/tsconfig.json"),
              compilerOptions: {
                rootDir: "src",
                outDir: "out",
                noEmit: false,
                declaration: false,
                sourceMap: false,
                noUnusedLocals: false,
                noUnusedParameters: false,
                plugins: [
                  { transform: "typia/lib/transform", enabled: false },
                  {
                    transform: "@nestia/core/native/transform.cjs",
                    ...(native ? { llm: true } : { enabled: false }),
                  },
                ],
              },
              include: ["src"],
            },
            null,
            2,
          ),
        );
        const result = runPublicCompilerCli(consumer, fixture, cache, [
          "-p",
          "tsconfig.json",
          "--noEmit",
        ]);
        const diagnostics =
          `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replaceAll(
            "\\",
            "/",
          );
        if (native) {
          assert.notEqual(
            result.status,
            0,
            "The LLM controller must fail analysis.",
          );
          for (const expected of [
            "src/llm-route.ts:11:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
            "- IArticle.weak: WeakMap",
            "- LLM schema does not support WeakMap type.",
          ])
            assert(
              diagnostics.includes(expected),
              `Missing ${expected}\n${diagnostics}`,
            );
        } else assert.equal(result.status, 0, diagnostics);
        assert(
          !fs.existsSync(path.join(fixture, "out")),
          `${name}: noEmit published output`,
        );
      } catch (error) {
        console.error(`Public noEmit ${name} failed`, error);
        failures.push(error);
      }
    }
    if (failures.length)
      throw new AggregateError(failures, "Public noEmit controls failed.");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

module.exports = { test_public_no_emit_diagnostics };
