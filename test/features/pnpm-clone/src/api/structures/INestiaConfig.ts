import type { OpenApi } from "./OpenApi";
import type { PartialOpenApi } from "./PartialOpenApi";
import type { RecordstringOpenApi } from "./RecordstringOpenApi";

export namespace INestiaConfig {
  /** Building `swagger.json` is also possible. */
  export type ISwaggerConfig = {
    /**
     * Response path of the `swagger.json`.
     *
     * If you've configured only directory, the file name would be the
     * `swagger.json`. Otherwise you've configured the full path with file name
     * and extension, the `swagger.json` file would be renamed to it.
     */
    output: string;

    /**
     * OpenAPI version.
     *
     * If you configure this property to be `2.0` or `3.0`, the newly generated
     * `swagger.json` file would follow the specified OpenAPI version. The newly
     * generated `swagger.json` file would be downgraded from the OpenAPI v3.1
     * specification by {@link OpenApi.downgrade} method.
     *
     * @default 3.1
     */
    openapi?: undefined | "2.0" | "3.0" | "3.1";

    /**
     * Whether to beautify JSON content or not.
     *
     * If you configure this property to be `true`, the `swagger.json` file
     * would be beautified with indentation (2 spaces) and line breaks. If you
     * configure numeric value instead, the indentation would be specified by
     * the number.
     *
     * @default false
     */
    beautify?: undefined | number | boolean;

    /**
     * Whether to include additional information or not.
     *
     * If configured to be `true`, those properties would be added into each API
     * endpoinnt.
     *
     * - `x-nestia-method`
     * - `x-nestia-namespace` ` `x-nestia-jsDocTags`
     *
     * @default false
     */
    additional?: undefined | boolean;

    /**
     * API information.
     *
     * If omitted, `package.json` content would be used instead.
     */
    info?: undefined | PartialOpenApi.IDocument.IInfo;

    /** List of server addresses. */
    servers?: undefined | OpenApi.IServer[];

    /**
     * Security schemes.
     *
     * When generating `swagger.json` file through `nestia`, if your controllers
     * or theirs methods have a security key which is not enrolled in here
     * property, it would be an error.
     */
    security?: undefined | RecordstringOpenApi.ISecurityScheme;

    /**
     * List of tag names with description.
     *
     * It is possible to omit this property or skip some tag name even if the
     * tag name is used in the API routes. In that case, the tag name would be
     * used without description.
     *
     * Of course, if you've written a comment like `@tag {name} {description}`,
     * you can entirely replace this property specification.
     */
    tags?: undefined | OpenApi.IDocument.ITag[];

    /**
     * Decompose query DTO.
     *
     * If you configure this property to be `true`, the query DTO would be
     * decomposed into individual query parameters per each property. Otherwise
     * you set it to be `false`, the query DTO would be one object type which
     * contains all of query parameters.
     *
     * @default true
     */
    decompose?: undefined | boolean;
  };
}
