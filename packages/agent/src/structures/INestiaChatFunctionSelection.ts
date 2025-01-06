import { IHttpLlmFunction } from "@samchon/openapi";

export interface INestiaChatFunctionSelection {
  function: IHttpLlmFunction<"chatgpt">;
  reason: string;
}
