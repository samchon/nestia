import { IHttpLlmFunction } from "@samchon/openapi";

/**
 * Nestia A.I. chatbot function selection.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaChatFunctionSelection {
  /**
   * Target function.
   *
   * Function that has been selected to prepare LLM function calling,
   * or canceled due to no more required.
   */
  function: IHttpLlmFunction<"chatgpt">;

  /**
   * The reason of the function selection or cancellation.
   */
  reason: string;
}
