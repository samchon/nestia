import {
  IHttpConnection,
  IHttpLlmApplication,
  IHttpLlmFunction,
  IHttpResponse,
} from "@samchon/openapi";
import { ILlmApplicationOfValidate, ILlmFunctionOfValidate } from "typia";

/**
 * Controller of the Nestia Agent.
 *
 * `INestiaAgentController` is a type represents a controller of the
 * {@link NestiaAgent}, which serves a set of functions to be called
 * by A.I. chatbot from LLM function calling.
 *
 * Also, `INestiaAgentController` is an union type which can specify
 * a subtype by checking the {@link protocol} property.
 *
 * - HTTP server: {@link INestiaAgentController..IHttp}
 * - TypeScript class: {@link INestiaAgentController.IClass}
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type INestiaAgentController =
  | INestiaAgentController.IHttp
  | INestiaAgentController.IClass;
export namespace INestiaAgentController {
  /**
   * HTTP controller.
   *
   * You can make it by {@link createHttpLlmApplication} function with
   * the Swagger or OpenAPI document.
   */
  export interface IHttp extends IBase<"http", IHttpLlmApplication<"chatgpt">> {
    /**
     * Connection to the server.
     *
     * Connection to the API server including the URL and headers.
     */
    connection: IHttpConnection;

    /**
     * Executor of the API function.
     *
     * @param props Properties of the API function call
     * @returns HTTP response of the API function call
     */
    execute?: (props: {
      /**
       * Connection to the server.
       */
      connection: IHttpConnection;

      /**
       * Application schema.
       */
      application: IHttpLlmApplication<"chatgpt">;

      /**
       * Function schema.
       */
      function: IHttpLlmFunction<"chatgpt">;

      /**
       * Arguments of the function calling.
       *
       * It is an object of key-value pairs of the API function's parameters.
       * The property keys are composed by below rules:
       *
       * - parameter names
       * - query parameter as an object type if exists
       * - body parameter if exists
       */
      arguments: object;
    }) => Promise<IHttpResponse>;
  }

  /**
   * TypeScript class controller.
   *
   * You can make it by `typia.llm.application<App, Model>()` function.
   *
   * - https://typia.io/docs/llm/application
   */
  export interface IClass
    extends IBase<"class", ILlmApplicationOfValidate<"chatgpt">> {
    /**
     * Executor of the class function.
     *
     * @param props Properties of the function call.
     * @returns Return value of the function call.
     */
    execute: (props: {
      /**
       * Target application schema.
       */
      application: ILlmApplicationOfValidate<"chatgpt">;

      /**
       * Target function schema.
       */
      function: ILlmFunctionOfValidate<"chatgpt">;

      /**
       * Arguments of the function calling.
       */
      arguments: object;
    }) => Promise<unknown>;
  }

  interface IBase<Protocol, Application> {
    /**
     * Protocol discrminator.
     */
    protocol: Protocol;

    /**
     * Name of the controller.
     */
    name: string;

    /**
     * Application schema of function calling.
     */
    application: Application;
  }
}
