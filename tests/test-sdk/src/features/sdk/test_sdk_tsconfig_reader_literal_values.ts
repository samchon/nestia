import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies `TsConfigReader` keeps string values intact, resolves `typeRoots`
 * against the file that wrote them, and accepts a byte order mark.
 *
 * Trailing commas were removed by a regular expression over the whole text, so
 * a value such as `", }"` lost its comma. A relative `typeRoots` of an extended
 * file was forwarded to a wrapper project in another directory and pointed
 * nowhere, and a tsconfig saved with a BOM failed to parse.
 *
 * 1. Write a base config in a folder and a project config in another that extends
 *    it, with comments, trailing commas, strings holding comma-and-bracket text
 *    and relative `typeRoots` in both.
 * 2. Read the project config.
 * 3. Assert the strings are unchanged, each `typeRoots` entry is absolute and
 *    anchored at its own file, and a BOM-prefixed file reads like its plain
 *    twin.
 *
 * @evidence contracts/testing.md#behavioral-verification The built reader parses real files through its extends chain, and the compared values are the exact strings and absolute paths the compiler would use, so each of the three former defects changes one assertion.
 * @evidence contracts/testing.md#independent-expectations The expected strings are the authored literals and the expected roots are path.resolve of the directory that holds the authored file, which is how tsc resolves a relative option.
 * @evidence contracts/testing.md#distinguishing-cases A string with comma-and-brace text and a real trailing comma sit side by side, typeRoots from a base and from the project differ in anchor, and the BOM file has a plain twin; an option other than typeRoots is the control that keeps its written form.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-sdk process against the built SDK utility loaded by absolute path, using a mkdtemp directory removed in finally; no compiler or server starts.
 */
export async function test_sdk_tsconfig_reader_literal_values(): Promise<void> {
  const { TsConfigReader } = require(
    path.resolve(process.cwd(), "../../packages/sdk/lib/utils/TsConfigReader"),
  ) as {
    TsConfigReader: {
      read: (file: string) => Promise<{
        compilerOptions?: Record<string, any>;
      }>;
    };
  };
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-tsconfig-"),
  );
  try {
    const base: string = path.join(root, "base");
    const project: string = path.join(root, "project");
    fs.mkdirSync(base);
    fs.mkdirSync(project);
    fs.writeFileSync(
      path.join(base, "tsconfig.base.json"),
      `{
  // a comment, with "quotes" and a comma,
  "compilerOptions": {
    "typeRoots": ["./base-types",],
    "outDir": "./base-out",
  },
}`,
      "utf8",
    );
    const body: string = `{
  "extends": "../base/tsconfig.base.json",
  "compilerOptions": {
    "typeRoots": ["./project-types", "../shared/types",],
    "paths": { "@x": [", }", "a, ]"], },
    "plugins": [{ "transform": "x, }" },],
  },
}`;
    fs.writeFileSync(path.join(project, "tsconfig.json"), body, "utf8");
    fs.writeFileSync(path.join(project, "bom.json"), "﻿" + body, "utf8");

    for (const file of ["tsconfig.json", "bom.json"]) {
      const options = (await TsConfigReader.read(path.join(project, file)))
        .compilerOptions!;
      TestValidator.equals(`${file} strings`, options.paths, {
        "@x": [", }", "a, ]"],
      });
      TestValidator.equals(`${file} plugin`, options.plugins, [
        { transform: "x, }" },
      ]);
      TestValidator.equals(`${file} typeRoots`, options.typeRoots, [
        path.resolve(project, "project-types"),
        path.resolve(project, "..", "shared", "types"),
      ]);
      TestValidator.equals(
        `${file} other option`,
        options.outDir,
        "./base-out",
      );
    }
    const inherited = (
      await TsConfigReader.read(path.join(base, "tsconfig.base.json"))
    ).compilerOptions!;
    TestValidator.equals("base typeRoots", inherited.typeRoots, [
      path.resolve(base, "base-types"),
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
