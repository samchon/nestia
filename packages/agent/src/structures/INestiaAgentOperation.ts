import { IHttpLlmFunction } from "@samchon/openapi";
import { ILlmFunctionOfValidate } from "typia";

import { INestiaAgentController } from "./INestiaAgentController";

/**
 * Operation information in the Nestia Agent.
 *
 * `INestiaAgentOperation` is a type represents an operation that would
 * be selected by the A.I. chatbot of {@link NestiaAgent} class to
 * perform the LLM (Large Language Model) function calling.
 *
 * Also, it is an union type that is discriminated by the {@link protocol}
 * property. If the protocol value is `http`, it means that the HTTP API
 * operation would be called by the A.I. chatbot. Otherwise, if the protocol
 * value is `class`, it means that the operation has come from a
 * TypeScript class.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type INestiaAgentOperation =
  | INestiaAgentOperation.IHttp
  | INestiaAgentOperation.IClass;
export namespace INestiaAgentOperation {
  /**
   * HTTP API operation.
   */
  export type IHttp = IBase<
    "http",
    INestiaAgentController.IHttp,
    IHttpLlmFunction<"chatgpt">
  >;

  /**
   * TypeScript class operation.
   */
  export type IClass = IBase<
    "class",
    INestiaAgentController.IClass,
    ILlmFunctionOfValidate<"chatgpt">
  >;

  interface IBase<Protocol, Application, Function> {
    /**
     * Protocol discriminator.
     */
    protocol: Protocol;

    /**
     * Belonged controller of the target function.
     */
    controller: Application;

    /**
     * Target function to call.
     */
    function: Function;

    /**
     * Identifier name.
     */
    name: string;
  }
}
