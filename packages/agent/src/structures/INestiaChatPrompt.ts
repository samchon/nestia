import { IHttpLlmFunction, IHttpResponse } from "@samchon/openapi";

import { INestiaChatFunctionSelection } from "./INestiaChatFunctionSelection";

export type INestiaChatPrompt =
  | INestiaChatPrompt.IText
  | INestiaChatPrompt.ISelect
  | INestiaChatPrompt.ICancel
  | INestiaChatPrompt.IExecute
  | INestiaChatPrompt.IDescribe;
export namespace INestiaChatPrompt {
  export interface ICancel {
    kind: "cancel";
    id: string;
    functions: INestiaChatFunctionSelection[];
  }

  export interface ISelect {
    kind: "select";
    id: string;
    functions: INestiaChatFunctionSelection[];
  }

  export interface IExecute {
    kind: "execute";
    role: "assistant";
    id: string;
    function: IHttpLlmFunction<"chatgpt">;
    arguments: object;
    response: IHttpResponse;
  }

  export interface IDescribe {
    kind: "describe";
    executions: IExecute[];
    text: string;
  }

  export interface IText {
    kind: "text";
    role: "assistant" | "user";
    text: string;
  }
}
