import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { SourceFinder } from "../../../../../../../packages/sdk/src/utils/SourceFinder";

/**
 * Verifies controller discovery takes a literal directory literally and a glob
 * pattern with either path separator.
 *
 * `DynamicModule.mount()` and `EncryptedModule.dynamic()` globbed
 * `path.resolve(pattern)`. On Windows that turned `src/**\/*.js` into a
 * backslash path, which glob reads as escapes, and on every platform a
 * directory such as `app [v2]` read as a character class; either way no
 * controller was mounted and the application started without routes (#1668).
 * `@nestia/sdk`'s finder, which reads `INestiaConfig.input`, failed an absolute
 * path holding such characters the same way.
 *
 * 1. Write a controller module into `app [v2]/controllers` under a temporary
 *    directory.
 * 2. Mount it by the literal directory, by a native-separator glob, and by a `/`
 *    glob, and assert one controller each time; an `exclude` naming the file
 *    mounts none.
 * 3. Assert `@nestia/sdk`'s finder expands the same inputs.
 */
export const test_dynamic_module_paths = async (): Promise<void> => {
  const root: string = path.resolve(
    __dirname,
    "../../../.tmp-dynamic-module-paths",
  );
  const directory: string = path.join(root, "app [v2]", "controllers");
  const file: string = path.join(directory, "ProbeController.js");
  fs.rmSync(root, { recursive: true, force: true });
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
  try {
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

    for (const input of [directory, native, posix])
      TestValidator.equals(`sdk ${input}`, await SourceFinder.expand(input), [
        input === directory ? directory : file,
      ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
