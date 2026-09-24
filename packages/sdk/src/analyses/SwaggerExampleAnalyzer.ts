import { SwaggerExample } from "@nestia/core";
import { OpenApi } from "@typia/interface";

export namespace SwaggerExampleAnalyzer {
  /**
   * The named examples `@SwaggerExample` attached, as the Example Objects an
   * OpenAPI `examples` map holds.
   *
   * The decorator stores each named example as its value, and documents used to
   * carry the value itself. OpenAPI 3.x names examples with Example Objects,
   * whose `value` holds the value, so a tool read the raw value as an Example
   * Object and found no example in it (#1649). `@TypedException()` examples are
   * declared as Example Objects already.
   */
  export const examples = (
    data: SwaggerExample.IData<any> | undefined,
  ): Record<string, OpenApi.IExample> | undefined =>
    data?.examples === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(data.examples).map(([key, value]) => [key, { value }]),
        );
}
