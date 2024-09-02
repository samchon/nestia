import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import fs from "fs";
import path from "path";
import { format } from "prettier";
import typia, { IValidation, tags } from "typia";

import { MigrateApplication } from "../MigrateApplication";
import { MigrateFileArchiver } from "../archivers/MigrateFileArchiver";
import { MigrateInquirer } from "./MigrateInquirer";

export namespace MigrateCommander {
  export const main = async (): Promise<void> => {
    const resolve = (str: string | undefined) =>
      str ? path.resolve(str).split("\\").join("/") : undefined;
    const options: MigrateInquirer.IOutput = await MigrateInquirer.parse();

    // VALIDATE OUTPUT DIRECTORY
    const parent: string = resolve(options.output + "/..")!;
    if (fs.existsSync(options.output)) halt("Output directory alreay exists.");
    else if (fs.existsSync(parent) === false)
      halt("Output directory's parent directory does not exist.");
    else if (fs.statSync(parent).isDirectory() === false)
      halt("Output directory's parent is not a directory.");

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

    const result: IValidation<MigrateApplication> =
      await MigrateApplication.create(document);
    if (result.success === false) {
      console.log(result.errors);
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
      );
    }

    const app: MigrateApplication = result.data;
    const program =
      options.mode === "nest" ? app.nest(options) : app.sdk(options);
    if (program.errors)
      for (const error of program.errors)
        console.error(
          `Failed to migrate ${error.method} ${error.path}`,
          ...error.messages.map((msg) => `  - ${msg}`),
        );
    await MigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: async (file, content) =>
        fs.promises.writeFile(file, await beautify(content), "utf-8"),
    })(options.output)(program.files);
  };

  const beautify = async (script: string): Promise<string> => {
    try {
      return await format(script, {
        parser: "typescript",
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
