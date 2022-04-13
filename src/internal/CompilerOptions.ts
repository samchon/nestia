import * as fs from "fs";

export interface CompilerOptions
{
    target: string;
    module: string;
    lib: string[];
    strict: boolean;
    downlevelIteration: boolean;
    esModuleInterop?: boolean;
    plugins?: Array<{ 
        transform?: string 
    }>;
    types?: string[];
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
}
export namespace CompilerOptions
{
    /* -----------------------------------------------------------
        DEFAULT VALUES
    ----------------------------------------------------------- */
    export const DEPENDENCIES: string[] = [
        "nestia-fetcher", 
        "typescript-is"
    ];

    export const TRANSFORMERS: string[] = [
        "typescript-is/lib/transform-inline/transformer", 
        "typescript-transform-paths"
    ];

    export const TYPES: string[] = []

    export const DEFAULT = {
        target: "es5",
        module: "commonjs",
        lib: [
            "DOM", 
            "ES2015"
        ],
        strict: true,
        downlevelIteration: true,
        esModuleInterop: true,
        plugins: TRANSFORMERS.map(transform => ({ transform })),
        types: [
            "node",
            "reflect-metadata"
        ],
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
    };

    export function emend(options: CompilerOptions): boolean
    {
        // FILL ARRAY DATA
        if (!options.plugins)
            options.plugins = [];
        if (!options.types)
            options.types = [];
        
        // CONSTRUCT CHECKERS
        const emended: Required<CompilerOptions> = options as Required<CompilerOptions>;
        const checkers: Array<() => boolean> = [
            () => 
            {
                let changed: boolean = false;
                for (const transform of CompilerOptions.TRANSFORMERS)
                {
                    if (emended.plugins.find(elem => elem.transform === transform) !== undefined)
                        continue;
    
                    changed = true;
                    emended.plugins.push({ transform });
                }
                return changed;
            },
            () =>
            {
                let changed: boolean = false;
                for (const type of CompilerOptions.TYPES)
                {
                    if (emended.types.find(elem => elem === type) !== undefined)
                        continue;
    
                    changed = true;
                    emended.types.push(type);
                }
                return changed;
            },
            () =>
            {
                const changed: boolean = emended.experimentalDecorators !== true;
                if (changed)
                    emended.experimentalDecorators = true;
                return changed;
            },
            () =>
            {
                const changed: boolean = emended.emitDecoratorMetadata !== true;
                if (changed)
                    emended.emitDecoratorMetadata = true;
                return changed;
            },
            () =>
            {
                const changed: boolean = emended.esModuleInterop !== true;
                if (changed)
                    emended.esModuleInterop = true;
                return changed;
            }
        ];

        // DO CHECK IT
        const checks: boolean[] = checkers.map(func => func());
        return checks.some(flag => flag);
    }

    /* -----------------------------------------------------------
        PROCEDURES
    ----------------------------------------------------------- */
    export function temporary(config: IConfig): () => Promise<[string, () => Promise<void>]>
    {
        return async () =>
        {
            const file: string = `nestia.temporary.tsconfig.${Math.random().toString().substr(2)}.json`;
            
            await fs.promises.writeFile
            (
                file,
                JSON.stringify(config, null, 2),
                "utf8" 
            );
            return [file, () => fs.promises.unlink(file)];
        };
    }
}

interface IConfig
{
    compilerOptions?: CompilerOptions;
}