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
            { transform: "typescript-transform-paths" }
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
        else
        {
            // FILL ESSENTIAL PROPS
            const options: CSON.CommentObject = config.compilerOptions as CSON.CommentObject;
            for (const [key, value] of Object.entries(DEFAULT_OPTIONS))
            {
                if (!options[key])
                    CSON.assign(config.compilerOptions, { [key]: value });
                else if (options[key] instanceof Array && value instanceof Array && key !== "plugins")
                    CSON.assign
                    (
                        config.compilerOptions,
                        { 
                            [key]: 
                            [
                                ...new Set
                                ([
                                    ...value, 
                                    ...options[key] as string[]
                                ])
                            ]
                        }
                    );
            }

            if (!options.plugins)
                CSON.assign(options.plugins, { plugins: DEFAULT_OPTIONS.plugins });
            else
            {
                const optionPlugins: CSON.CommentArray<CSON.CommentObject> = options.plugins as CSON.CommentArray<CSON.CommentObject>;
                for (const plugin of DEFAULT_OPTIONS.plugins)
                {
                    const found = optionPlugins.find(elem => elem.transform === plugin.transform);
                    if (!found)
                        optionPlugins.push(plugin);
                }
            }
        }

        // OVERWRITE THE CONTENT
        await fs.promises.writeFile
        (
            "tsconfig.json",
            CSON.stringify(config, null, 2),
            "utf8"
        );
    }
}