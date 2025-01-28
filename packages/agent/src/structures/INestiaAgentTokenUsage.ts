/**
 * Token usage information from the A.I. chatbot.
 *
 * `INestiaAgentTokenUsage` is a structure representing the token usage
 * information from the {@link NestiaAgent} class. And you can get the
 * token usage information by calling the {@link NestiaAgent.getTokenUsage}
 * method.
 *
 * For reference, `INestiaAgentTokenUsage` provides only the token usage
 * information, and does not contain any price or cost information. It is
 * because the price or cost can be changed by below reasons.
 *
 * - Type of {@link INestiaAgentProps.provider LLM provider}
 * - {@link INestiaAgentProvider.model} in the LLM provider.
 * - Just by a policy change of the LLM provider company.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaAgentTokenUsage {
  /**
   * Total token usage.
   */
  total: number;

  /**
   * Token usage in the prompt.
   *
   * In other words, it is called as the input token.
   */
  prompt: INestiaAgentTokenUsage.IPrompt;

  /**
   * Token usage in the completion.
   *
   * In other words, it is called as the output token.
   */
  completion: INestiaAgentTokenUsage.ICompletion;
}
export namespace INestiaAgentTokenUsage {
  export interface IPrompt {
    total: number;
    audio: number;
    cached: number;
  }
  export interface ICompletion {
    total: number;
    accepted_prediction: number;
    audio: number;
    reasoning: number;
    rejected_prediction: number;
  }
}
