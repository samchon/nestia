import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import path from "path";

/**
 * Verifies controller discovery takes a literal directory literally and a glob
 * pattern with either path separator.
 *
 * `DynamicModule.mount()` globbed `path.resolve(pattern)`. On Windows that
 * turned `src/**\/*.js` into a backslash path, which glob reads as escapes, and
 * on every platform a directory such as `app [v2]` read as a character class;
 * either way no controller was mounted and the application started without
 * routes (#1668). The rule is portable path handling over a real directory, so
 * it needs no generated SDK, compiler or HTTP application.
 *
 * 1. Write a controller module into `app [v2]/controllers` under a temporary
 *    directory.
 * 2. Mount it by the literal directory, by a native-separator glob, and by a `/`
 *    glob, and assert one controller each time; an `exclude` naming the file
 *    mounts none.
 *
 * @evidence contracts/testing.md#behavioral-verification The built `DynamicModule.mount()` discovers a real controller file under a directory whose name holds glob metacharacters; the counted mounted controllers distinguish a literal-as-pattern regression (zero) from correct discovery (one).
 * @evidence contracts/testing.md#independent-expectations One authored controller file exists, so the expected counts 1, 1, 1 and 0 follow from the fixture rather than from the implementation's own glob result; Nest's `@Controller` metadata is the discovery criterion.
 * @evidence contracts/testing.md#distinguishing-cases The literal directory, the native-separator glob and the `/` glob are the positive cases; the `exclude` naming the file is the negative twin. On POSIX the native and `/` spellings coincide, so the backslash defect is observable only where the separator differs.
 * @evidence contracts/testing.md#execution-ownership This matching export runs in the shared serial unit process against the built `@nestia/core` loaded by absolute path, with no consumer installation, compiler or server. It replaces the former `dynamic-module-paths` SDK feature, whose generated-SDK compilation exercised no part of this rule; the temporary tree is removed in finally.
 */
export const test_dynamic_module_paths = async (): Promise<void> => {
  const core = path.resolve(process.cwd(), "../../packages/core");
  const { DynamicModule } = require(
    path.join(core, "lib/decorators/DynamicModule"),
  ) as {
    DynamicModule: {
      mount: (
        input: string | { include: string[]; exclude?: string[] },
      ) => Promise<unknown>;
    };
  };
  const common: string = createRequire(path.join(core, "package.json")).resolve(
    "@nestjs/common",
  );
  const metadata = Reflect as typeof Reflect & {
    getMetadata: (key: string, target: object) => unknown;
  };
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-dynamic-module-paths-"),
  );
  const directory: string = path.join(root, "app [v2]", "controllers");
  const file: string = path.join(directory, "ProbeController.js");
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      file,
      [
        `const { Controller } = require(${JSON.stringify(common)});`,
        `class ProbeController {}`,
        `Controller("probe")(ProbeController);`,
        `exports.ProbeController = ProbeController;`,
      ].join("\n"),
      "utf8",
    );
    const count = async (
      input: string | { include: string[]; exclude?: string[] },
    ): Promise<number> =>
      (
        metadata.getMetadata(
          "controllers",
          (await DynamicModule.mount(input)) as object,
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
