import { IHttpLlmFunction, IHttpResponse } from "@samchon/openapi";

export interface INestiaChatFunctionPrompt {
  kind: "function";
  role: "assistant";
  function: IHttpLlmFunction<"chatgpt">;
  id: string;
  input: object;
  response: IHttpResponse;
}
