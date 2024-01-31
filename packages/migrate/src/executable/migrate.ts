#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { MigrateApplication } from "../MigrateApplication";
import { ISwagger } from "../structures/ISwagger";
import { SetupWizard } from "../utils/SetupWizard";

const USAGE = `Wrong command has been detected. Use like below:

npx @nestia/migrate [input] [output]

  ex) npx @nestia/migrate swagger.json my-new-project
`;

function halt(desc: string): never {
  console.error(desc);
  process.exit(-1);
}

const main = async (argv: string[]): Promise<void> => {
  const resolve = (str: string | undefined) =>
    str ? path.resolve(str).split("\\").join("/") : undefined;
  const input: string | undefined = resolve(argv[0]);
  const output: string | undefined = resolve(argv[1]);

  // VALIDATE ARGUMENTS
  if (input === undefined || output === undefined) halt(USAGE);

  // VALIDATE OUTPUT DIRECTORY
  const parent: string = resolve(output + "/..")!;
  if (fs.existsSync(output)) halt("Output directory alreay exists.");
  else if (fs.existsSync(parent) === false)
    halt("Output directory's parent directory does not exist.");
  else if (fs.statSync(parent).isDirectory() === false)
    halt("Output directory's parent is not a directory.");

  // READ SWAGGER
  const swagger: ISwagger = (() => {
    if (fs.existsSync(input) === false)
      halt("Unable to find the input swagger.json file.");
    const stats: fs.Stats = fs.statSync(input);
    if (stats.isFile() === false) halt("The input swagger.json is not a file.");
    const content: string = fs.readFileSync(input, "utf-8");
    const swagger: ISwagger = JSON.parse(content);
    return swagger;
  })();

  // DO GENERATE
  const app: MigrateApplication = new MigrateApplication(swagger);
  await app.generate(output);

  // RUN SCRIPTS
  SetupWizard.setup(output);
};
main(process.argv.slice(2)).catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
