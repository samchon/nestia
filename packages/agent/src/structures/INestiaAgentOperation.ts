import { IHttpLlmFunction } from "@samchon/openapi";
import { ILlmFunctionOfValidate } from "typia";

import { INestiaAgentController } from "./INestiaAgentController";

export type INestiaAgentOperation =
  | INestiaAgentOperation.IHttp
  | INestiaAgentOperation.IClass;
export namespace INestiaAgentOperation {
  export type IHttp = IBase<
    "http",
    INestiaAgentController.IHttp,
    IHttpLlmFunction<"chatgpt">
  >;

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
