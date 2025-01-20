import { IHttpLlmFunction } from "@samchon/openapi";

export interface __IChatInitialApplication {
  /**
   * Get list of API functions.
   *
   * If user seems like to request some function calling except this one,
   * call this `getApiFunctions()` to get the list of candidate API functions
   * provided from this application.
   *
   * Also, user just wants to list up every remote API functions that can be
   * called from the backend server, utilize this function too.
   */
  getApiFunctions({}): Promise<Array<IHttpLlmFunction<"chatgpt">>>;
}
