import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import sortImport from "@trivago/prettier-plugin-sort-imports";
import fs from "fs";
import path from "path";
import { format } from "prettier";
import jsDoc from "prettier-plugin-jsdoc";
import typia, { IValidation, tags } from "typia";

import { NestiaMigrateApplication } from "../NestiaMigrateApplication";
import { NestiaMigrateFileArchiver } from "../archivers/NestiaMigrateFileArchiver";
import { NestiaMigrateInquirer } from "./NestiaMigrateInquirer";

export namespace NestiaMigrateCommander {
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
      | OpenApiV3_1.IDocument = await (async () => {
      if (typia.is<string & tags.Format<"uri">>(options.input)) {
        const response: Response = await fetch(options.input);
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
      console.log(result.errors);
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
      );
    }

    const app: NestiaMigrateApplication = result.data;
    const files: Record<string, string> =
      options.mode === "nest" ? app.nest(options) : app.sdk(options);
    if (app.getErrors())
      for (const error of app.getErrors())
        console.error(
          `Failed to migrate ${error.method} ${error.path}`,
          ...error.messages.map((msg) => `  - ${msg}`),
        );
    await NestiaMigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: async (file, content) =>
        fs.promises.writeFile(file, await beautify(content), "utf-8"),
      root: options.output,
      files,
    });
  };

  export const beautify = async (script: string): Promise<string> => {
    try {
      return await format(script, {
        parser: "typescript",
        plugins: [sortImport, jsDoc],
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
}
