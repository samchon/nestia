import { __IChatFunctionReference } from "./__IChatFunctionReference";

export interface __IChatSelectionApplication {
  /**
   * Select proper API functions to call.
   *
   * If you A.I. agent has found some proper API functions to call
   * from the conversation with user, please select the API functions
   * just by calling this function.
   *
   * When user wants to call a same function multiply, you A.I. agent must
   * list up it multiply in the `functions` property. Otherwise the user has
   * requested to call many different functions,  you A.I. agent have to assign
   * them all into the `functions` property.
   *
   * Also, if you A.I. agent can't speciify a specific function to call due to lack
   * of specificity or homogeneity of candidate functions, just assign all of them
   * by in the` functions` property` too.
   *
   * Instead, when you've succeeded to specify a function to call, erase the
   * other candidates by calling the {@link cancelFunction} function.
   *
   * @param props Properties of the function
   */
  selectFunction(props: __IChatFunctionReference.IProps): Promise<void>;

  /**
   * Cancel a function from the candidate list to call.
   *
   * If you A.I. agent has understood that the user wants to cancel
   * some candidate functions to call from the conversation, please cancel
   * them through this function.
   *
   * Also, if you've selected multiple functions to call from the
   * {@link selectFunction} because of the candidate pooling reason. The
   * candidate pooling reason means that user wants only one function to
   * call, but you A.I. agent selects multiple candidate functions because
   * the A.I. agent can't specify only one thing due to lack of specificity
   * or homogeneity of candidate functions.
   */
  cancelFunction(props: __IChatFunctionReference.IProps): Promise<void>;
}
