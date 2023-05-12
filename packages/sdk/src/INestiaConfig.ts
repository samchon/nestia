import type ts from "typescript";

import type { ISwaggerDocument } from "./structures/ISwaggerDocument";
import type { StripEnums } from "./utils/StripEnums";

/**
 * Definition for the `nestia.config.ts` file.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaConfig {
    /**
     * Building `swagger.json` is also possible.
     *
     * If not specified, you can't build the `swagger.json`.
     */
    swagger?: INestiaConfig.ISwaggerConfig;

    /**
     * List of files or directories containing the NestJS controller classes.
     */
    input: string | string[] | INestiaConfig.IInput;

    /**
     * Output directory that SDK would be placed in.
     *
     * If not configured, you can't build the SDK library.
     */
    output?: string;

    /**
     * Target directory that SDK distribution files would be placed in.
     *
     * If you configure this property and runs `npx nestia sdk` command,
     * distribution environments for the SDK library would be generated.
     *
     * After the SDK library generation, move to the `distribute` directory,
     * and runs `npm publish` command, then you can share SDK library with
     * other client (frontend) developers.
     *
     * Recommend to use `"packages/api"` value.
     */
    distribute?: string;

    /**
     * Target directory that e2e test functions would be placed in.
     *
     * If you configure this property and runs `npx nestia e2e` command,
     * `@nestia/sdk` will analyze your NestJS backend server code, and
     * generates e2e test functions for every API endpoints.
     *
     * If not configured, you can't run `npx nestia e2e` command.
     */
    e2e?: string;

    /**
     * Compiler options for the TypeScript.
     *
     * If you've omitted this property or the assigned property cannot fully cover the
     * `tsconfig.json`, the properties from the `tsconfig.json` would be assigned to here.
     * Otherwise, this property has been configured and it's detailed values are different
     * with the `tsconfig.json`, this property values would be used instead.
     *
     * ```typescript
     * import ts from "typescript";
     *
     * const tsconfig: ts.TsConfig;
     * const nestiaConfig: IConfiguration;
     *
     * const compilerOptions: ts.CompilerOptions = {
     *     ...tsconfig.compilerOptions,
     *     ...(nestiaConfig.compilerOptions ?? {})
     * }
     * ```
     */
    compilerOptions?: StripEnums<ts.CompilerOptions>;

    /**
     * Whether to assert parameter types or not.
     *
     * If you configure this property to be `true`, all of the function
     * parameters of SDK library would be checked through
     * [`typia.assert<T>()` function](https://typia.io/docs/validators/assert/).
     *
     * This option would make your SDK library compilation time a little bit slower,
     * but would enahcne the type safety even in the runtime level.
     *
     * @default false
     */
    assert?: boolean;

    /**
     * Whether to optimize JSON string conversion 10x faster or not.
     *
     * If you configure this property to be `true`, the SDK library would utilize the
     * [`typia.assertStringify<T>() function`](https://github.com/samchon/typia#enhanced-json)
     * to boost up JSON serialization speed and ensure type safety.
     *
     * This option would make your SDK library compilation time a little bit slower,
     * but would enhance JSON serialization speed 10x faster. Also, it can ensure type
     * safety even in the rumtime level.
     *
     * @default false
     */
    json?: boolean;

    /**
     * Whether to wrap DTO by primitive type.
     *
     * If you don't configure this property as `false`, all of DTOs in the
     * SDK library would be automatically wrapped by {@link Primitive} type.
     *
     * For refenrece, if a DTO type be capsuled by the {@link Primitive} type,
     * all of methods in the DTO type would be automatically erased. Also, if
     * the DTO has a `toJSON()` method, the DTO type would be automatically
     * converted to return type of the `toJSON()` method.
     *
     * @default true
     */
    primitive?: boolean;
}
export namespace INestiaConfig {
    /**
     * List of files or directories to include or exclude to specifying the NestJS
     * controllers.
     */
    export interface IInput {
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
    export interface ISwaggerConfig {
        /**
         * Output path of the `swagger.json`.
         *
         * If you've configured only directory, the file name would be the `swagger.json`.
         * Otherwise you've configured the full path with file name and extension, the
         * `swagger.json` file would be renamed to it.
         */
        output: string;

        /**
         * API information.
         *
         * If omitted, `package.json` content would be used instead.
         */
        info?: Partial<ISwaggerDocument.IInfo>;

        /**
         * List of server addresses.
         */
        servers?: ISwaggerDocument.IServer[];

        /**
         * Security schemes.
         */
        security?: Record<string, ISwaggerConfig.ISecurityScheme>;
    }
    export namespace ISwaggerConfig {
        export type ISecurityScheme =
            | IApiKey
            | Exclude<
                  ISwaggerDocument.ISecurityScheme,
                  ISwaggerDocument.ISecurityScheme.IApiKey
              >;
        export interface IApiKey {
            type: "apiKey";

            /**
             * @default header
             */
            in?: "header" | "query" | "cookie";

            /**
             * @default Authorization
             */
            name?: string;
        }
    }
}
