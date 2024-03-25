import fs from "fs";
import path from "path";
import { format } from "prettier";
import { IValidation } from "typia";

import { MigrateApplication } from "../MigrateApplication";
import { MigrateFileArchiver } from "../archivers/MigrateFileArchiver";
import { ISwagger } from "../structures/ISwagger";
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
    const swagger: ISwagger = (() => {
      if (fs.existsSync(options.input) === false)
        halt("Unable to find the input swagger.json file.");
      const stats: fs.Stats = fs.statSync(options.input);
      if (stats.isFile() === false)
        halt("The input swagger.json is not a file.");
      const content: string = fs.readFileSync(options.input, "utf-8");
      const swagger: ISwagger = JSON.parse(content);
      return swagger;
    })();

    const result: IValidation<MigrateApplication> =
      await MigrateApplication.create(swagger);
    if (result.success === false) {
      console.log(result.errors);
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
      );
    }

    const app: MigrateApplication = result.data;
    const { files } =
      options.mode === "nest" ? app.nest(options) : app.sdk(options);
    await MigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: async (file, content) =>
        fs.promises.writeFile(file, await beautify(content), "utf-8"),
    })(options.output)(files);
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
