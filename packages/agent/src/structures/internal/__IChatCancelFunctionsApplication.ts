import { __IChatFunctionReference } from "./__IChatFunctionReference";

export interface __IChatCancelFunctionsApplication {
  /**
   * Cancel a function from the candidate list to call.
   *
   * If you A.I. agent has understood that the user wants to cancel
   * some candidate functions to call from the conversation, please cancel
   * them through this function.
   *
   * Also, when you A.I. find a function that has been selected by the candidate
   * pooling, cancel the function by calling this function. For reference, the
   * candidate pooling means that user wants only one function to call, but you A.I.
   * agent selects multiple candidate functions because the A.I. agent can't specify
   * only one thing due to lack of specificity or homogeneity of candidate functions.
   *
   * Additionally, if you A.I. agent wants to cancel same function multiply, you can
   * do it by assigning the same function name multiply in the `functions` property.
   *
   * @param props Properties of the function
   */
  cancelFunctions(props: __IChatFunctionReference.IProps): Promise<void>;
}
