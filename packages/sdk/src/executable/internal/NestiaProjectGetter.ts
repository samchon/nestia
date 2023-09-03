import { NestiaConfigLoader } from "./NestiaConfigLoader";

export namespace NestiaProjectGetter {
    export async function get(): Promise<string> {
        const config = await NestiaConfigLoader.config({
            module: "CommonJS" as any,
            noEmit: true,
        });
        return config.project ?? "tsconfig.json";
    }
}
