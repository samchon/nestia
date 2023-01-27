import fs from "fs";
import path from "path";
import * as runner from "ts-node";
import { Singleton } from "tstl/thread/Singleton";

import { assert } from "typia";

import { INestiaConfig } from "../../INestiaConfig";

export namespace NestiaSdkConfig {
    export function get(): Promise<INestiaConfig | null> {
        return singleton.get();
    }

    const singleton = new Singleton(async () => {
        if (fs.existsSync("nestia.config.ts") === false) return null;

        runner.register({
            emit: false,
            compilerOptions: {
                module: "CommonJS",
                noEmit: true,
            },
        });

        const loaded: INestiaConfig & { default?: INestiaConfig } =
            await import(path.resolve("nestia.config.ts"));
        if (typeof loaded !== "object")
            throw new Error("Error on NestiaConfig.get(): failed to load data");

        const config: INestiaConfig =
            typeof loaded.default === "object" ? loaded.default : loaded;
        const cloned: INestiaConfig = JSON.parse(JSON.stringify(config));
        return assert(cloned);
    });
}
