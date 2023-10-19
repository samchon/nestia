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
        const compilerOptions: ts.CompilerOptions =
            await NestiaConfigLoader.compilerOptions(
                getFileArgument({
                    type: "project",
                    extension: "json",
                }) ?? "tsconfig.json",
            );
        const config: INestiaConfig = await NestiaConfigLoader.config(
            getFileArgument({
                type: "config",
                extension: "ts",
            }) ?? "nestia.config.ts",
            compilerOptions,
        );

        // GENERATE
        const app: NestiaSdkApplication = new NestiaSdkApplication(
            config,
            compilerOptions,
        );
        await task(app);
    };

    const getFileArgument = (props: {
        type: string;
        extension: string;
    }): string | null => {
        const argv: string[] = process.argv.slice(3);
        if (argv.length === 0) return null;

        const index: number = argv.findIndex(
            (str) => str === `--${props.type}`,
        );
        if (index === -1) return null;
        else if (argv.length === 1)
            throw new Error(`${props.type} file must be provided`);

        const file: string = argv[index + 1];
        if (file.endsWith(props.extension) === false)
            throw new Error(
                `${props.type} file must be ${props.extension} file`,
            );
        return file;
    };
}
