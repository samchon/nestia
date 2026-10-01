import * as prettierPluginSortImport from "@trivago/prettier-plugin-sort-imports";
import {
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import fs from "fs";
import path from "path";
import { format } from "prettier";
import * as prettierPluginJsDoc from "prettier-plugin-jsdoc";
import type { IValidation } from "typia";

import { NestiaMigrateApplication } from "../NestiaMigrateApplication";
import { NestiaMigrateFileArchiver } from "../archivers/NestiaMigrateFileArchiver";
import { NestiaMigrateInquirer } from "./NestiaMigrateInquirer";

/**
 * The command-line entry of `@nestia/migrate`.
 *
 * @evidence contracts/common.md#principled-implementation The command reads the options, validates the output directory, reads the document from a file or an http(s) URL, converts it, reports the operations that could not be migrated, and writes the files, formatting only TypeScript files.
 * @evidence contracts/common.md#clear-and-simple-design One entry function, with formatting, halting, and URL detection as private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every failure ends with a message and a non-zero exit, and unformattable content is written unformatted.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation The output path is resolved with `path.resolve` and its parent tested with `existsSync` and `statSync`, with backslashes converted to `/`, which Windows accepts. The input is fetched when it parses as an http or https URL, so a Windows path whose drive letter parses as a scheme is read from disk, and it is read as UTF-8 otherwise. Only files with a `.ts`, `.cts`, `.mts` or `.tsx` extension, tested case-sensitively, are formatted, and text is written without a byte order mark and with the line endings the generator and Prettier produce, which are not the platform's. A failure ends the process through `process.exit(-1)`, whose status the platform truncates to a non-zero value.
 */
export namespace NestiaMigrateCommander {
  /**
   * Runs the command: reads the options and the document, generates the
   * project, and writes it to the output directory.
   *
   * It stops with an error when the output directory exists, when its parent
   * does not exist or is not a directory, when the input cannot be read or
   * fetched, or when the document is invalid.
   *
   * @evidence contracts/common.md#principled-implementation The checks run before any file is written, the document is fetched only for an http or https URL, a failed HTTP status stops the command, and only files with a TypeScript extension are formatted, because Prettier's TypeScript parser would rewrite a dotfile line into code.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous function whose phases are marked in comments, with the option parsing in `NestiaMigrateInquirer`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The checks apply to every input, and a formatting failure keeps the original text.
   * @evidence contracts/common.md#meaningful-documentation The comment states the conditions under which it stops.
   * @evidence contracts/portability.md#os-neutral-implementation Creation and writing use `fs.promises` through the injected archiver, so the volume decides case policy and permissions, and the checks that precede any write are the filesystem's own answers.
   */
  export const main = async (): Promise<void> => {
    const resolve = (str: string | undefined) =>
      str ? path.resolve(str).split("\\").join("/") : undefined;
    const options: NestiaMigrateInquirer.IOutput =
      await NestiaMigrateInquirer.parse();

    // VALIDATE OUTPUT DIRECTORY
    const parent: string = resolve(options.output + "/..")!;
    if (fs.existsSync(options.output))
      halt("Response directory already exists.");
    else if (fs.existsSync(parent) === false)
      halt("Response directory's parent directory does not exist.");
    else if (fs.statSync(parent).isDirectory() === false)
      halt("Response directory's parent is not a directory.");

    // READ SWAGGER
    const document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument = await (async () => {
      if (isUri(options.input)) {
        const response: Response = await fetch(options.input);
        if (response.ok === false)
          halt(
            `Unable to fetch the input swagger.json: ${response.status} ${response.statusText}`,
          );
        const content: string = await response.text();
        return JSON.parse(content);
      }
      if (fs.existsSync(options.input) === false)
        halt("Unable to find the input swagger.json file.");
      const stats: fs.Stats = fs.statSync(options.input);
      if (stats.isFile() === false)
        halt("The input swagger.json is not a file.");
      const content: string = await fs.promises.readFile(
        options.input,
        "utf-8",
      );
      return JSON.parse(content);
    })();

    const result: IValidation<NestiaMigrateApplication> =
      NestiaMigrateApplication.validate(document);
    if (result.success === false) {
      console.error("nestia migrate: invalid swagger:");
      for (const err of result.errors)
        console.error(`  - ${err.path}: ${err.value}`);
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec): ${options.input}`,
      );
    }

    const app: NestiaMigrateApplication = result.data;
    const files: Record<string, string> =
      options.mode === "nest" ? app.nest(options) : app.sdk(options);
    if (app.getData().errors)
      for (const error of app.getData().errors)
        console.error(
          `Failed to migrate ${error.method} ${error.path}`,
          ...error.messages.map((msg) => `  - ${msg}`),
        );
    await NestiaMigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      // only TypeScript is formatted: prettier's TypeScript parser also
      // accepts a `.gitignore` or `.env` line, and rewrites it into code
      writeFile: async (file, content) =>
        fs.promises.writeFile(
          file,
          /\.[cm]?tsx?$/.test(file) ? await beautify(content) : content,
          "utf-8",
        ),
      root: options.output,
      files,
    });
  };

  const beautify = async (script: string): Promise<string> => {
    try {
      return await format(script, {
        parser: "typescript",
        plugins: [prettierPluginSortImport, prettierPluginJsDoc],
        importOrder: ["<THIRD_PARTY_MODULES>", "^[./]"],
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
        importOrderParserPlugins: ["decorators-legacy", "typescript", "jsx"],
        bracketSpacing: true,
      });
    } catch {
      return script;
    }
  };

  const halt = (desc: string): never => {
    console.error(desc);
    process.exit(-1);
  };

  const isUri = (input: string): boolean => {
    try {
      const url: URL = new URL(input);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };
}
