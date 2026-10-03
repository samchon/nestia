import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { runPublicCompilerCli } from "../internal/PublicCompiler";

const { createRequire } = require("node:module");

/**
 * Verifies the installed public compiler rejects a conflicting typia runtime
 * before publishing artifacts and reports both involved versions.
 *
 * Direct descriptor units cannot establish that the compiler discovers and
 * forwards its guard failure. This boundary uses the existing packed install
 * and an authored local package manifest, without another installation or
 * host.
 *
 * 1. Author a project whose local typia version differs from core's linked one.
 * 2. Run the public ttsc JavaScript CLI with the shared cache and ordinary loader.
 * 3. Require a completed nonzero exit, both versions and no emitted output.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual installed ttsc CLI must complete with a nonzero exit and a guard diagnostic naming core's linked typia and the authored different project version, while publishing no out directory. Spawn failures, signals and unrelated diagnostic failures cannot satisfy these checks.
 * @evidence contracts/testing.md#independent-expectations The linked version is resolved from the installed core descriptor's own ordinary require context; the authored project declares a distinct minor version. The native descriptor compatibility contract independently requires both identities in its rejection and prohibits successful emit.
 * @evidence contracts/testing.md#distinguishing-cases This owns the actual mismatched-version compiler connection. Core test_typia_version_guard separately owns matching, exports-blocked and mismatched direct descriptor decisions. The shared HTTP producer supplies the actual matching-version compiler positive against the same installed core.
 * @evidence contracts/testing.md#execution-ownership The shared public HTTP runner calls this matching exported JavaScript case once after installation. Its real compiler child makes it integration logic; the direct descriptor case belongs to the separate core unit population.
 * @evidence contracts/e2e.md#necessary-boundary Installed ttsc discovery, the installed core descriptor, project package resolution and CLI exit/diagnostics must agree on rejection. Direct Node descriptor calls and in-process Go rules cannot prove that public wrapper connection.
 * @evidence contracts/e2e.md#shared-execution The case reuses all eight already packed packages and the caller's absolute compiler cache. A small conflicting project is the necessary negative input; its descriptor must reject before any native artifact is built. It installs no package and starts no application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One containment-checked project under the assigned private consumer owns its local manifest, source and configuration. Both initial reset and finally cleanup affect only that project; the real consumer packages and shared cache remain unchanged. The plain Node child clears inherited loader overrides and preserves other toolchain settings.
 * @evidence contracts/e2e.md#preserved-coverage The old transform-options whole-CLI mismatch status, both-version diagnostic and absent output assertions remain here, strengthened by explicit completed-exit and signal checks. Its three direct descriptor controls execute in core's Node unit; no separate installed copy or native preparation is retained for them.
 */
export function test_public_typia_version_guard(
  consumer: { root: string; requirePublic: NodeRequire },
  cache: string,
) {
  const fixture = path.join(consumer.root, "projects/typia-version-mismatch");
  const relative = path.relative(consumer.root, fixture);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  fs.rmSync(fixture, { recursive: true, force: true });
  try {
    const coreRequire = createRequire(
      consumer.requirePublic.resolve("@nestia/core/native/transform.cjs"),
    );
    const expected = coreRequire("typia/package.json").version;
    const other = `${expected.split(".")[0]}.99.0`;
    const typia = path.join(fixture, "node_modules/typia");
    fs.mkdirSync(typia, { recursive: true });
    fs.writeFileSync(
      path.join(typia, "package.json"),
      JSON.stringify({ name: "typia", version: other }),
    );
    fs.mkdirSync(path.join(fixture, "src"));
    fs.writeFileSync(
      path.join(fixture, "src/main.ts"),
      `import { TypedBody } from "@nestia/core";
export class Controller {
  public store(@TypedBody() input: { value: string }): void { input; }
}
`,
    );
    fs.writeFileSync(
      path.join(fixture, "tsconfig.json"),
      JSON.stringify({
        extends: path.resolve(__dirname, "../../../../config/tsconfig.json"),
        compilerOptions: {
          rootDir: "src",
          outDir: "out",
          noEmit: false,
          plugins: [
            { transform: "typia/lib/transform", enabled: false },
            { transform: "@nestia/core/native/transform.cjs" },
          ],
        },
        include: ["src"],
      }),
    );
    const result = runPublicCompilerCli(consumer, fixture, cache, [
      "-p",
      "tsconfig.json",
    ]);
    assert(Number.isInteger(result.status) && result.status !== 0);
    const diagnostics = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    assert(
      diagnostics.includes(`typia ${expected} transform`) &&
        diagnostics.includes(`typia ${other}`),
      `The public compiler did not reject naming both versions:\n${diagnostics}`,
    );
    assert(!fs.existsSync(path.join(fixture, "out")));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}
