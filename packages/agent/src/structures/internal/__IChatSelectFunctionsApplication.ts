import { __IChatFunctionReference } from "./__IChatFunctionReference";

export interface __IChatSelectFunctionsApplication {
  /**
   * Select proper API functions to call.
   *
   * If you A.I. agent has found some proper API functions to call
   * from the conversation with user, please select the API functions
   * just by calling this function.
   *
   * When user wants to call a same function multiply, you A.I. agent must
   * list up it multiply in the `functions` property. Otherwise the user has
   * requested to call many different functions, you A.I. agent have to assign
   * them all into the `functions` property.
   *
   * Also, if you A.I. agent can't specify a specific function to call due to lack
   * of specificity or homogeneity of candidate functions, just assign all of them
   * by in the` functions` property` too. Instead, when you A.I. agent can specify
   * a specific function to call, the others would be eliminated.
   *
   * @param props Properties of the function
   */
  selectFunctions(props: __IChatFunctionReference.IProps): Promise<void>;
}
