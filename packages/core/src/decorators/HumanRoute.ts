import { SwaggerCustomizer } from "./SwaggerCustomizer";

/**
 * Human only API marking.
 *
 * This decorator marks the API for human only, so that LLM function calling
 * schema composer (of [`@samchon/openapi`](https://github.com/samchon/openapi))
 * excludes the API.
 *
 * In other words, if you adjust the `@HumanRoute()` decorator to the API, the
 * API never participates in the LLM function calling. When calling the
 * {@link HttpLlm.application} function, matched {@link IHttpLlmFunction} data
 * never be composed.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @returns Method decorator
 */
export function HumanRoute(): MethodDecorator {
  return SwaggerCustomizer((props) => {
    props.route["x-samchon-human"] = true;
  });
}
