import commander from "commander";
import fs from "fs";
import inquirer from "inquirer";

import { PackageManager } from "./PackageManager";

export namespace ArgumentParser {
    export interface IArguments {
        compiler: "ts-patch" | "ttypescript";
        manager: "npm" | "pnpm" | "yarn";
        project: string | null;
    }

    export async function parse(pack: PackageManager): Promise<IArguments> {
        // PREPARE ASSETS
        commander.program.option("--compiler [compiler]", "compiler type");
        commander.program.option("--manager [manager", "package manager");
        commander.program.option(
            "--project [project]",
            "tsconfig.json file location",
        );

        // INTERNAL PROCEDURES
        const questioned = { value: false };
        const action = (
            closure: (options: Partial<IArguments>) => Promise<IArguments>,
        ) => {
            return new Promise<IArguments>((resolve, reject) => {
                commander.program.action(async (options) => {
                    try {
                        resolve(await closure(options));
                    } catch (exp) {
                        reject(exp);
                    }
                });
                commander.program.parseAsync().catch(reject);
            });
        };
        const select =
            (name: string) =>
            (message: string) =>
            async <Choice extends string>(
                choices: Choice[],
            ): Promise<Choice> => {
                questioned.value = true;
                return (
                    await inquirer.createPromptModule()({
                        type: "list",
                        name: name,
                        message: message,
                        choices: choices,
                    })
                )[name];
            };
        const configure = async () => {
            const fileList: string[] = await (
                await fs.promises.readdir(process.cwd())
            )
                .filter(
                    (str) =>
                        str.substring(0, 8) === "tsconfig" &&
                        str.substring(str.length - 5) === ".json",
                )
                .sort((x, y) =>
                    x === "tsconfig.json"
                        ? -1
                        : y === "tsconfig.json"
                        ? 1
                        : x < y
                        ? -1
                        : 1,
                );
            if (fileList.length === 0) {
                if (process.cwd() !== pack.directory)
                    throw new Error(`Unable to find "tsconfig.json" file.`);
                return null;
            } else if (fileList.length === 1) return fileList[0];
            return select("tsconfig")("TS Config File")(fileList);
        };

        // DO CONSTRUCT
        return action(async (options) => {
            if (options.compiler === undefined) {
                console.log(COMPILER_DESCRIPTION);
                options.compiler = await select("compiler")(`Compiler`)(
                    pack.data.scripts?.build === "nest build"
                        ? ["ts-patch" as const, "ttypescript" as const]
                        : ["ttypescript" as const, "ts-patch" as const],
                );
            }
            options.manager ??= await select("manager")("Package Manager")([
                "npm" as const,
                "pnpm" as const,
                "yarn" as const,
            ]);
            pack.manager = options.manager;
            options.project ??= await configure();

            if (questioned.value) console.log("");
            return options as IArguments;
        });
    }
}

const COMPILER_DESCRIPTION = [
    `Since Typescript tsc compiler doesn't support transformers we have to use alternative complier which support the feature.`,
    ``,
    `If you choose "ttypescript", use "ttsc" instead of "tsc" to compile your code.`,
    ``,
    `Otherwise, you can choose "ts-patch" and keep the original "tsc" command.`,
    `But keep in mind that "ts-patch" hacks node_modules/typescript source code to implement the feature.`,
    `Also, "npm run prepare" must be run after reinstalling or updating the "typescript" package.`,
    ``,
    `"ts-patch" is recommended if you are using "@nest/cli".`,
    ``,
].join("\n");
