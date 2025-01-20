export interface __IChatFunctionReference {
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
}
export namespace __IChatFunctionReference {
  export interface IProps {
    /**
     * List of target functions.
     */
    functions: __IChatFunctionReference[];
  }
}
