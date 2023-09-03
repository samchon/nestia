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
        const project: string = await NestiaConfigLoader.project();
        const compilerOptions: ts.CompilerOptions =
            await NestiaConfigLoader.compilerOptions(project);
        const config: INestiaConfig = await NestiaConfigLoader.config(
            compilerOptions,
        );

        // GENERATE
        const app: NestiaSdkApplication = new NestiaSdkApplication(
            config,
            compilerOptions,
        );
        await task(app);
    };
}
