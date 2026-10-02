import { SwaggerCustomizer } from "./SwaggerCustomizer";

/**
 * Human only API marking.
 *
 * This decorator marks the API for human only, so that LLM function calling
 * schema composer excludes the API.
 *
 * In other words, if you adjust the `@HumanRoute()` decorator to the API, the
 * API never participates in the LLM function calling. When calling the
 * {@link HttpLlm.application} function, matched {@link IHttpLlmFunction} data
 * never be composed.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @returns Method decorator
 * @evidence contracts/common.md#principled-implementation The decorator marks the operation with the `x-samchon-human` extension through `SwaggerCustomizer`, so the generated document carries the mark without another metadata path.
 * @evidence contracts/common.md#clear-and-simple-design One call to the customizer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The extension name is the documented contract of the generated document.
 * @evidence contracts/common.md#meaningful-documentation The comment states that a marked API is left out of the LLM function calling schema.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The OpenAPI extension is an in-memory document property and has no native path or process representation.
 */
export function HumanRoute(): MethodDecorator {
  return SwaggerCustomizer((props) => {
    props.route["x-samchon-human"] = true;
  });
}
