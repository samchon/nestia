import { Primitive } from "nestia-fetcher";
import * as tsc from "typescript";

export namespace CompilerOptions
{
    /* -----------------------------------------------------------
        DEFAULT VALUES
    ----------------------------------------------------------- */
    const ESSENTIAL_OPTIONS = {
        types: [
            "node",
            "reflect-metadata"
        ],
        noEmit: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
    };

    export const DEFAULT_OPTIONS = {
        ...ESSENTIAL_OPTIONS,
        target: "es5",
        module: "commonjs",
    };

    export function emend(options: tsc.CompilerOptions, assert: boolean): [boolean, boolean]
    {
        // EMEND PROPERTIES
        for (const [key, value] of Object.entries(ESSENTIAL_OPTIONS))
            if (options[key] instanceof Array && value instanceof Array)
                merge_array(options[key] as Array<any>, value);
            else if (typeof options[key] === "object")
                Object.assign(options[key], value);
            else
                options[key] = value;

        //----
        // CONSTRUCT PLUGINS
        //----
        // INITALIZE PLUGINS
        if (!options.plugins || !(options.plugins instanceof Array))
            options.plugins = [];
        
        let transformed: boolean = false;

        const plugins: Record<string, any>[] = <any>options.plugins as Record<string, any>[];
        const emplace = (input: Record<string, any>) =>
        {
            const found = plugins.find(p => Primitive.equal_to(p, input));
            if (found === undefined)
                plugins.push(input);
            transformed ||= true;
        };
        
        if (assert === true)
            emplace({ 
                transform: "typescript-is/lib/transform-inline/transformer" 
            });
        if (options.paths && Object.entries(options.paths).length !== 0)
            emplace({ transform: "typescript-transform-paths" });
        return [transformed, !!options.baseUrl];
    }

    function merge_array<T>(origin: T[], must: T[]): void
    {
        for (const m of must)
        {
            const found: T | undefined = origin.find(elem => elem === m);
            if (found !== undefined)
                continue;

            origin.push(m);
        }
    }
}