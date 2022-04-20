import * as tsc from "typescript";

/**
 * Definition for the `nestia.config.ts` file.
 * 
 * @author Samchon
 */
export interface IConfiguration
{
    /**
     * List of files or directories containing the NestJS controller classes.
     */
    input: string | string[] | IConfiguration.IInput;

    /**
     * Output directory that SDK would be placed in.
     */
    output: string;

    /**
     * Compiler options for the TypeScript.
     * 
     * If omitted, the configuration would follow the `tsconfig.json`.
     */
    compilerOptions?: tsc.CompilerOptions;

    /**
     * Whether to assert parameter types or not.
     * 
     * If you configure this option to be `true`, all of the function parameters would be
     * checked through the [typescript-is](https://github.com/woutervh-/typescript-is).
     */
    assert?: boolean;

    /**
     * Whether to optimize JSON string conversion 2x faster or not.
     * 
     * If you configure this option to be `true`, the SDK library would utilize the
     * [typescript-json](https://github.com/samchon/typescript-json) and the JSON string
     * conversion speed really be 2x faster.
     */
    json?: boolean;
}
export namespace IConfiguration
{
    /**
     * List of files or directories to include or exclude to specifying the NestJS 
     * controllers.
     */
    export interface IInput
    {
        /**
         * List of files or directories containing the NestJS controller classes.
         */
        include: string[];

        /**
         * List of files or directories to be excluded.
         */
        exclude?: string[];
    }
}