import { NestiaConfigLoader } from "./NestiaConfigLoader";

export namespace NestiaProjectGetter {
    export async function get(file: string): Promise<string> {
        const config = await NestiaConfigLoader.config(file, {
            module: "CommonJS" as any,
            noEmit: true,
        });
        return config.project ?? "tsconfig.json";
    }
}
