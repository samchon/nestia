import { INestiaSdkConfiguration } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaSdkConfiguration = {
    /**
     * List of files or directories containing the NestJS controller classes.
     */
    input: "src/controllers",

    /**
     * Output directory that SDK would be placed in.
     *
     * If not configured, you can't build the SDK library.
     */
    output: "src/api",

    /**
     * Whether to assert parameter types or not.
     *
     * If you configure this property to be `true`, all of the function parameters would be
     * checked through the [typia](https://github.com/samchon/typia#runtime-type-checkers).
     * This option would make your SDK library slower, but would enahcne the type safety even
     * in the runtime level.
     *
     * @default false
     */
    // assert: true,

    /**
     * Whether to optimize JSON string conversion 2x faster or not.
     *
     * If you configure this property to be `true`, the SDK library would utilize the
     * [typia](https://github.com/samchon/typia#fastest-json-string-converter)
     * and the JSON string conversion speed really be 2x faster.
     *
     * @default false
     */
    // json: true,

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
    // primitive: false,

    /**
     * Building `swagger.json` is also possible.
     *
     * If not specified, you can't build the `swagger.json`.
     */
    swagger: {
        /**
         * Output path of the `swagger.json`.
         *
         * If you've configured only directory, the file name would be the `swagger.json`.
         * Otherwise you've configured the full path with file name and extension, the
         * `swagger.json` file would be renamed to it.
         */
        output: "dist/swagger.json",
    },
};
export default NESTIA_CONFIG;
