import fs from "fs";
import path from "path";
import * as runner from "ts-node";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { Primitive } from "nestia-fetcher";
import { Singleton } from "tstl/thread/Singleton";
import { assertType, is } from "typescript-is";

import { IConfiguration } from "../../IConfiguration";

export namespace NestiaConfig
{
    export function get(): Promise<IConfiguration | null>
    {
        return singleton.get();
    }

    function assert(config: IConfiguration): IConfiguration
    {
        assertType<Omit<typeof config, "input"|"compilerOptions">>(config);
        if (is<string>(config.input) === false
            && is<string[]>(config.input) === false
            && is<IConfiguration.IInput>(config.input) === false)
            throw new InvalidArgument("Error on NestiaConfig.get(): invalid input type.");

        return config;
    }

    const singleton = new Singleton(async () =>
    {
        if (fs.existsSync("nestia.config.ts") === false)
            return null;

        runner.register({
            emit: false,
            compilerOptions: {
                noEmit: true
            }
        });

        const config: IConfiguration = await import(path.resolve("nestia.config.ts"));
        try
        {
            return assert(Primitive.clone(config));
        }
        catch (exp)
        {
            const trial: IConfiguration & { default?: IConfiguration } = config as any;
            if (trial.default && typeof trial.default === "object")
                return assert(Primitive.clone(trial.default));
            else
                throw exp;
        }
    });
}