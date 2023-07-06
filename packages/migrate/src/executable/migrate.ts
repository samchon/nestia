#!/usr/bin/env node
import fs from "fs";

import { NestiaMigrateApplication } from "../NestiaMigrateApplication";
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

const main = async (argv: string[]) => {
    const input: string | undefined = argv[0];
    const output: string | undefined = argv[1];

    // VALIDATE ARGUMENTS
    if (input === undefined || output === undefined) halt(USAGE);
    else if (fs.existsSync(output)) halt("Output directory alreay exists.");
    else if (fs.existsSync(output + "/..") === false)
        halt("Output directory's parent directory does not exist.");
    else if ((await fs.promises.stat(output + "/..")).isDirectory() === false)
        halt("Output directory's parent is not a directory.");

    // READ SWAGGER
    const swagger: ISwagger = await (async () => {
        if (fs.existsSync(input) === false)
            halt("Unable to find the input swagger.json file.");
        const stats: fs.Stats = await fs.promises.stat(input);
        if (stats.isFile() === false)
            halt("The input swagger.json is not a file.");
        const content: string = await fs.readFileSync(input, "utf-8");
        const swagger: ISwagger = JSON.parse(content);
        return swagger;
    })();

    // DO GENERATE
    const app = new NestiaMigrateApplication(swagger);
    await app.generate({
        mkdir: fs.promises.mkdir,
        writeFile: (path, content) =>
            fs.promises.writeFile(path, content, "utf8"),
    })(output);

    // RUN SCRIPTS
    SetupWizard.setup(output);
};
main(process.argv.slice(2)).catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
