import { SwaggerExample } from "@nestia/core";
import { OpenApi } from "@typia/interface";

/**
 * Converts the named examples of `@SwaggerExample` into OpenAPI example
 * objects.
 *
 * @evidence contracts/common.md#principled-implementation The namespace maps each named value to an example object.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain mapping.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerExampleAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
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
   *
   * @evidence contracts/common.md#principled-implementation Each value is wrapped as `{ value }`, which is the OpenAPI example object.
   * @evidence contracts/common.md#clear-and-simple-design One conditional and one mapping.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are kept as given.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerExampleAnalyzer.examples analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
