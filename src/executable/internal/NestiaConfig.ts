import fs from "fs";
import path from "path";
import * as runner from "ts-node";
import { Primitive } from "nestia-fetcher";
import { Singleton } from "tstl/thread/Singleton";
import { assertType } from "typescript-json";

import { IConfiguration } from "../../IConfiguration";

export namespace NestiaConfig {
    export function get(): Promise<IConfiguration | null> {
        return singleton.get();
    }

    const singleton = new Singleton(async () => {
        if (fs.existsSync("nestia.config.ts") === false) return null;

        runner.register({
            emit: false,
            compilerOptions: {
                noEmit: true,
            },
        });

        const loaded: IConfiguration & { default?: IConfiguration } =
            await import(path.resolve("nestia.config.ts"));
        if (typeof loaded !== "object")
            throw new Error("Error on NestiaConfig.get(): failed to load data");

        const config: IConfiguration =
            typeof loaded.default === "object" ? loaded.default : loaded;

        return assertType(Primitive.clone(config));
    });
}
