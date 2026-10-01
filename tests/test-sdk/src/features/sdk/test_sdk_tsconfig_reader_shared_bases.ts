import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies shared tsconfig ancestors contribute to every inheritance branch.
 *
 * A permanent visited set confused a completed shared base with a cycle. The
 * later branch then lost inherited values and an earlier override won despite
 * TypeScript's last-base-wins rule. Active ancestors and completed results
 * require separate state.
 *
 * 1. Read a diamond whose left branch overrides common type roots while the right
 *    branch inherits the common roots without an override.
 * 2. Reverse the branches and add a direct project override as controls.
 * 3. Reject an actual inheritance cycle and read again after changing the base.
 *
 * @evidence contracts/testing.md#behavioral-verification The real reader merges a filesystem diamond and must return the last branch's complete options, while a circular chain must reject. Rewriting a base between reads must change the result.
 * @evidence contracts/testing.md#independent-expectations TypeScript's multiple-extends contract makes the later configuration win, including its inherited options. Literal root names distinguish common, branch and project ownership without deriving expectations from the reader.
 * @evidence contracts/testing.md#distinguishing-cases The diamond, reversed order and direct project override distinguish precedence; a real cycle contrasts with the shared acyclic ancestor, and a changed base distinguishes per-read reuse from stale cross-read retention.
 * @evidence contracts/testing.md#execution-ownership This SDK unit is discovered by test-sdk's source entry and calls the built reader directly. Its temporary config files are removed in finally; no compiler, native build, consumer installation or server starts.
 */
export async function test_sdk_tsconfig_reader_shared_bases(): Promise<void> {
  const { TsConfigReader } = require(
    path.resolve(process.cwd(), "../../packages/sdk/lib/utils/TsConfigReader"),
  ) as {
    TsConfigReader: {
      read: (
        file: string,
      ) => Promise<{ compilerOptions?: Record<string, any> }>;
    };
  };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-config-diamond-"));
  const write = (name: string, value: object): void =>
    fs.writeFileSync(path.join(root, `${name}.json`), JSON.stringify(value));
  const roots = async (name: string): Promise<unknown> =>
    (await TsConfigReader.read(path.join(root, `${name}.json`))).compilerOptions
      ?.typeRoots;
  try {
    write("common", { compilerOptions: { typeRoots: ["./common-types"] } });
    write("left", {
      extends: "./common.json",
      compilerOptions: { typeRoots: ["./left-types"] },
    });
    write("right", { extends: "./common.json" });
    write("diamond", { extends: ["./left.json", "./right.json"] });
    write("reversed", { extends: ["./right.json", "./left.json"] });
    write("override", {
      extends: ["./left.json", "./right.json"],
      compilerOptions: { typeRoots: ["./project-types"] },
    });
    TestValidator.equals(
      "last branch inherits common",
      await roots("diamond"),
      [path.join(root, "common-types")],
    );
    TestValidator.equals(
      "reversed last branch overrides",
      await roots("reversed"),
      [path.join(root, "left-types")],
    );
    TestValidator.equals("project wins", await roots("override"), [
      path.join(root, "project-types"),
    ]);
    write("cycle-a", { extends: "./cycle-b.json" });
    write("cycle-b", { extends: "./cycle-a.json" });
    await TestValidator.error("actual cycle", () => roots("cycle-a"));
    write("common", { compilerOptions: { typeRoots: ["./changed-types"] } });
    TestValidator.equals(
      "fresh read observes changed base",
      await roots("diamond"),
      [path.join(root, "changed-types")],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
