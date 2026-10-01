import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

/**
 * Verifies controller discovery takes a literal directory literally and a glob
 * pattern with either path separator.
 *
 * `DynamicModule.mount()` and `EncryptedModule.dynamic()` globbed
 * `path.resolve(pattern)`. On Windows that turned `src/**\/*.js` into a
 * backslash path, which glob reads as escapes, and on every platform a
 * directory such as `app [v2]` read as a character class; either way no
 * controller was mounted and the application started without routes (#1668).
 * The SDK finder expansion controls live in the shared unit population.
 *
 * 1. Write a controller module into `app [v2]/controllers` under a temporary
 *    directory.
 * 2. Mount it by the literal directory, by a native-separator glob, and by a `/`
 *    glob, and assert one controller each time; an `exclude` naming the file
 *    mounts none.
 *
 * @evidence contracts/testing.md#behavioral-verification Public DynamicModule.mount must load exactly one actual controller for literal bracket-bearing directory/native glob/forward-slash glob inputs and zero when the matching file is excluded.
 * @evidence contracts/testing.md#independent-expectations The test writes one real module decorated Controller(probe); literal filesystem existence establishes count1 and excluding that exact file establishes0 independently of the glob implementation.
 * @evidence contracts/testing.md#distinguishing-cases Literal brackets, native versus forward-slash wildcard spelling and explicit exclusion distinguish discovery branches. All three former SDK finder expansion assertions remain in test_sdk_source_finder_literal_paths.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual glob discovery, module import and Nest controller metadata must connect. Portable SDK pattern expansion is a shared unit case and cannot alone certify a loadable mounted module.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique mkdtemp root belongs to this copied feature and holds its own generated probe. Creation/loading assertions are enclosed by finally removing that exact root, without sweeping another invocation; the entry owns its backend lifetime.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_dynamic_module_paths = async (): Promise<void> => {
  const root: string = fs.mkdtempSync(
    path.resolve(__dirname, "../../../.tmp-dynamic-module-paths-"),
  );
  const directory: string = path.join(root, "app [v2]", "controllers");
  const file: string = path.join(directory, "ProbeController.js");
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      file,
      [
        `const { Controller } = require("@nestjs/common");`,
        `class ProbeController {}`,
        `Controller("probe")(ProbeController);`,
        `exports.ProbeController = ProbeController;`,
      ].join("\n"),
      "utf8",
    );
    const count = async (
      input: Parameters<typeof core.DynamicModule.mount>[0],
    ): Promise<number> =>
      (
        Reflect.getMetadata(
          "controllers",
          await core.DynamicModule.mount(input),
        ) as unknown[]
      ).length;
    const native: string = path.join(root, "app [v2]", "**", "*.js");
    const posix: string = native.split(path.sep).join("/");
    TestValidator.equals("literal", await count(directory), 1);
    TestValidator.equals("native glob", await count(native), 1);
    TestValidator.equals("posix glob", await count(posix), 1);
    TestValidator.equals(
      "exclude",
      await count({ include: [native], exclude: [file] }),
      0,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
