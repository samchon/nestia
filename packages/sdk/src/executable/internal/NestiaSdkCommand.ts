import ts from "typescript";

import { INestiaConfig } from "../../INestiaConfig";
import { NestiaSdkApplication } from "../../NestiaSdkApplication";
import { NestiaConfigLoader } from "./NestiaConfigLoader";

export namespace NestiaSdkCommand {
    export const sdk = () => main((app) => app.sdk());
    export const swagger = () => main((app) => app.swagger());
    export const e2e = () => main((app) => app.e2e());

    const main = async (task: (app: NestiaSdkApplication) => Promise<void>) => {
        await generate(task);
    };

    const generate = async (
        task: (app: NestiaSdkApplication) => Promise<void>,
    ) => {
        // LOAD CONFIG INFO
        const file: string = getConfigFile() ?? "nestia.config.ts";
        const project: string = await NestiaConfigLoader.project(file);
        const compilerOptions: ts.CompilerOptions =
            await NestiaConfigLoader.compilerOptions(project);
        const config: INestiaConfig = await NestiaConfigLoader.config(
            file,
            compilerOptions,
        );

        // GENERATE
        const app: NestiaSdkApplication = new NestiaSdkApplication(
            config,
            compilerOptions,
        );
        await task(app);
    };

    const getConfigFile = (): string | null => {
        const argv: string[] = process.argv.slice(3);
        if (argv.length < 1) return null;

        const index: number = argv.findIndex((str) => str === "--config");
        if (index === -1) return null;
        else if (argv.length === 1)
            throw new Error("Config file must be provided");

        const file: string = argv[index + 1];
        if (file.endsWith(".ts") === false)
            throw new Error("Config file must be TypeScript file");
        return file;
    };
}
