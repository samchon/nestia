import { IHttpLlmFunction, IHttpResponse } from "@samchon/openapi";

/**
 * Nestia A.I. chatbot event.
 *
 * `INestiaChatEvent` is an union type of all possible events that can
 * be emitted by the A.I. chatbot of the {@link NestiaChatAgent} class.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type INestiaChatEvent =
  | INestiaChatEvent.IIintializeEvent
  | INestiaChatEvent.ISelectFunctionEvent
  | INestiaChatEvent.ICancelFunctionEvent
  | INestiaChatEvent.ICallFunctionEvent
  | INestiaChatEvent.IFunctionCompleteEvent;
export namespace INestiaChatEvent {
  /**
   * Event of initializing the chatbot.
   */
  export interface IIintializeEvent {
    type: "initialize";
  }

  /**
   * Event of selecting a function to call.
   */
  export interface ISelectFunctionEvent {
    type: "select";

    /**
     * Selected function.
     *
     * Function that has been selected to prepare LLM function calling.
     */
    function: IHttpLlmFunction<"chatgpt">;

    /**
     * Reason of selecting the function.
     *
     * The A.I. chatbot will fill this property describing why the function
     * has been selected.
     */
    reason: string;
  }

  /**
   * Event of canceling a function calling.
   */
  export interface ICancelFunctionEvent {
    type: "cancel";

    /**
     * Selected function to cancel.
     *
     * Function that has been selected to prepare LLM function calling,
     * but canceled due to no more required.
     */
    function: IHttpLlmFunction<"chatgpt">;

    /**
     * Reason of selecting the function.
     *
     * The A.I. chatbot will fill this property describing why the function
     * has been cancelled.
     *
     * For reference, if the A.I. chatbot successfully completes the LLM
     * function calling, the reason of the fnction cancellation will be
     * "complete".
     */
    reason: string;
  }

  /**
   * Event of calling a function.
   */
  export interface ICallFunctionEvent {
    type: "call";

    /**
     * Target function to call.
     */
    function: IHttpLlmFunction<"chatgpt">;

    /**
     * Arguments of the function calling.
     *
     * If you modify this {@link arguments} property, it actually modifies
     * the backend server's request. Therefore, be careful when you're
     * trying to modify this property.
     */
    arguments: object;
  }

  /**
   * Event of completing a function calling.
   */
  export interface IFunctionCompleteEvent {
    type: "complete";

    /**
     * Target funtion that has been called.
     */
    function: IHttpLlmFunction<"chatgpt">;

    /**
     * Arguments of the function calling.
     */
    arguments: object;

    /**
     * Response of the function calling.
     */
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
