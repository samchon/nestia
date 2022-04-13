import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as tsc from "typescript";
import * as CSON from "comment-json"

export interface TsConfig
{
    compilerOptions?: tsc.CompilerOptions;
}
export namespace TsConfig
{
    /* -----------------------------------------------------------
        DEFAULT VALUES
    ----------------------------------------------------------- */
    const DEFAULT_OPTIONS = {
        target: "es5",
        module: "commonjs",
        types: [
            "node",
            "reflect-metadata"
        ],
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        plugins: [
            { transform: "typescript-is/lib/transform-inline/transformer" }, 
            // { transform: "typescript-transform-paths" }
        ]
    };

    export async function fulfill(): Promise<void>
    {
        if (fs.existsSync("tsconfig.json") === false)
        {
            // NO TSCONFIG.JSON EXISTS
            await fs.promises.copyFile
            (
                path.relative(process.cwd(), __dirname + "/tsconfig.default.json"),
                "tsconfig.json"
            );
            return;
        }

        const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
        const config: CSON.CommentObject = CSON.parse(content) as CSON.CommentObject;
        
        if (!config.compilerOptions)
        {
            // NO COMPILER-OPTION EXISTS
            const defaultConfig: CSON.CommentObject = JSON.parse
            (
                await fs.promises.readFile
                (
                    path.relative(process.cwd(), __dirname + "/tsconfig.default.json"),
                    "utf8"
                )
            );

            config.compilerOptions = defaultConfig.compilerOptions;
            await fs.promises.writeFile
            (
                "tsconfig.json",
                CSON.stringify(config, null, 2),
                "utf8"
            );
        }
        else if (emend(config.compilerOptions as CSON.CommentObject) === true)
        {
            // OVERWRITE THE CONTENT
            await fs.promises.writeFile
            (
                "tsconfig.json",
                CSON.stringify(config, null, 2),
                "utf8"
            );
        }
    }

    function emend(options: CSON.CommentObject): boolean
    {
        if (options.paths && Object.entries(options.paths).length !== 0)
            DEFAULT_OPTIONS.plugins.push({ transform: "typescript-transform-paths" });

        let changed: boolean = false;
        for (const [key, value] of Object.entries(DEFAULT_OPTIONS))
            if (options[key] instanceof Array && value instanceof Array)
            {
                merge<any>(options[key] as Array<any>, value,
                    key !== "plugins"
                        ? (x, y) => x === y
                        : (x, y) => x.transform === y.transform
                );
                changed ||= true;
            }
            else if (options[key] !== value)
            {
                CSON.assign(options, { [key]: value });
                changed ||= true;
            }
        return changed;
    }

    function merge<T>
        (
            origin: T[], 
            must: T[], 
            pred: (a: T, b: T) => boolean
        ): boolean
    {
        let changed: boolean = false;
        for (const m of must)
        {
            const found: T | undefined = origin.find(elem => pred(elem, m));
            if (found !== undefined)
                continue;

            origin.push(m);
            changed ||= true;
        }
        return changed;
    }
}