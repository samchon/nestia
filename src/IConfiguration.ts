import * as tsc from "typescript";

/**
 * Definition for the `nestia.config.ts` file.
 * 
 * @author Jeongho Nam - https://github.com/samchon
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
    output?: string;

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

    /**
     * Building `swagger.json` is also possible.
     */
    swagger?: IConfiguration.ISwagger;
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

    /**
     * Building `swagger.json` is also possible.
     */
    export interface ISwagger
    {
        /**
         * Output path of the `swagger.json`.
         * 
         * If you've configure only directory, the file name would be `swagger.json`. 
         * Otherwise you configure file name and extension, the `swagger.json` file would
         * be renamed to what you've configured.
         */
        output: string;
    }
}