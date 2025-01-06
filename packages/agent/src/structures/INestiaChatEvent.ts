import { IHttpLlmFunction, IHttpResponse } from "@samchon/openapi";

export type INestiaChatEvent =
  | INestiaChatEvent.IIintializeEvent
  | INestiaChatEvent.ISelectFunctionEvent
  | INestiaChatEvent.ICancelFunctionEvent
  | INestiaChatEvent.ICallFunctionEvent
  | INestiaChatEvent.IFunctionCompleteEvent;
export namespace INestiaChatEvent {
  export interface IIintializeEvent {
    type: "initialize";
  }

  export interface ISelectFunctionEvent {
    type: "select";
    function: IHttpLlmFunction<"chatgpt">;
    reason: string;
  }

  export interface ICancelFunctionEvent {
    type: "cancel";
    function: IHttpLlmFunction<"chatgpt">;
    reason: string;
  }

  export interface ICallFunctionEvent {
    type: "call";
    function: IHttpLlmFunction<"chatgpt">;
    arguments: object;
  }

  export interface IFunctionCompleteEvent {
    type: "complete";
    function: IHttpLlmFunction<"chatgpt">;
    arguments: object;
    response: IHttpResponse;
  }

  export type Type = INestiaChatEvent["type"];
  export type Mapper = {
    initialize: IIintializeEvent;
    select: ISelectFunctionEvent;
    cancel: ICancelFunctionEvent;
    call: ICallFunctionEvent;
    complete: IFunctionCompleteEvent;
  };
}
