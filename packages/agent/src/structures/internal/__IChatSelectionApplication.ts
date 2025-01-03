export interface __IChatSelectionApplication {
  /**
   * Select proper API function to call.
   *
   * If you A.I. agent has found some proper API function to call
   * from the conversation with user, please select the API function
   * just by calling this function.
   *
   * When user wants to call a same function multiply, you A.I. agent must
   * call this function multiply too.
   *
   * Also, if you A.I. agent can't speciify a specific function to call due to lack
   * of specificity or homogeneity of candidate functions, just select all of them
   * by calling this `selectFuncion()` function multiply.
   *
   * Instead, when you've succeeded to specify a function to call, erase the
   * other candidates by calling the {@link cancelFunction} function.
   *
   * @param props Properties of the function
   */
  selectFunction(props: {
    /**
     * The reason of the function selection.
     *
     * Just write the reason why you've determined to select this function.
     */
    reason: string;

    /**
     * Name of the target function to call.
     */
    name: string;
  }): Promise<void>;

  /**
   * Cancel a function from the candidate list to call.
   *
   * If you A.I. agent has understood that the user wants to cancel
   * a candidate function to call from the conversation, please cancel
   * it through this function.
   *
   * Also, if you've selected multiple functions to call from the
   * {@link selectFunction} because of the candidate pooling reason. The
   * candidate pooling reason means that user wants only one function to
   * call, but you A.I. agent selects multiple candidate functions because
   * you can't specify only one thing due to lack of specificity or homogeneity
   * of candidate functions.
   */
  cancelFunction(props: {
    /**
     * The reason why of the cancelation.
     *
     * Just write the reason why you've determined to cancel this function.
     */
    reason: string;

    /**
     * Name of the target function to cancel.
     */
    name: string;
  }): Promise<void>;
}
