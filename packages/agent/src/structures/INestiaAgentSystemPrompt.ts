import { INestiaAgentConfig } from "./INestiaAgentConfig";
import { INestiaAgentPrompt } from "./INestiaAgentPrompt";

/**
 * System prompt collection of the A.I. chatbot.
 *
 * `INestiaAgentSystemPrompt` is a type represents a collection of system
 * prompts that would be used by the A.I. chatbot of {@link NestiaAgent}.
 *
 * You can customize the system prompt by configuring the
 * {@link INestiaAgentConfig.systemPrompt} property when creating a new
 * {@link NestiaAgent} instance.
 *
 * If you don't configure any system prompts, the default system prompts
 * would be used which are written in the below directory as markdown
 * documents.
 *
 * - https://github.com/samchon/nestia/tree/master/packages/agent/prompts
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaAgentSystemPrompt {
  /**
   * Common system prompt that would be used in every situation.
   *
   * @param config Configuration of the agent
   * @returns The common system prompt
   * @default https://github.com/samchon/nestia/blob/master/packages/agent/prompts/common.md
   */
  common?: (config?: INestiaAgentConfig | undefined) => string;

  /**
   * Initialize system prompt.
   *
   * When the A.I. chatbot has not informed any functions to the agent
   * yet because the user has not implied any function calling request yet,
   * {@link NestiaAgent} says that it is a circumstance that nothing has
   * been initialized yet.
   *
   * In that case, the `initialize` system prompt would be used. You can
   * customize the `initialize` system prompt by assigning this function
   * with the given {@link INestiaAgentPrompt histories} parameter.
   *
   * @param histories Histories of the previous prompts
   * @returns initialize system prompt
   * @default https://github.com/samchon/nestia/blob/master/packages/agent/prompts/initialize.md
   */
  initialize?: (histories: INestiaAgentPrompt[]) => string;

  /**
   * Select system prompt.
   *
   * The {@link NestiaAgent} has a process selecting some candidate
   * functions to call by asking to the A.I. agent with the previous
   * prompt histories.
   *
   * In that case, this `select` system prompt would be used. You can
   * customize it by assigning this function with the given
   * {@link INestiaAgentPrompt histories} parameter.
   *
   * Note that, the `"select"` means only the function selection. It does
   * not contain the filling argument or executing the function. It
   * literally contains only the selection process.
   *
   * @param histories Histories of the previous prompts
   * @returns select system promopt
   * @default https://github.com/samchon/nestia/blob/master/packages/agent/prompts/select.md
   */
  select?: (histories: INestiaAgentPrompt[]) => string;

  /**
   * Cancel system prompt.
   *
   * The {@link NestiaAgent} has a process canceling some candidate
   * functions to call by asking to the A.I. agent with the previous
   * prompt histories.
   *
   * In that case, this `cancel` system prompt would be used. You can
   * customize it by assigning this function with the given
   * {@link INestiaAgentPrompt histories} parameter.
   *
   * @param histories Histories of the previous prompts
   * @returns cancel system prompt
   * @default https://github.com/samchon/nestia/blob/master/packages/agent/prompts/cancel.md
   */
  cancel?: (histories: INestiaAgentPrompt[]) => string;

  /**
   * Execute system prompt.
   *
   * The {@link NestiaAgent} has a process filling the arguments of some
   * selected candidate functions by the LLM (Large Language Model)
   * function calling feature with the previous prompt histories, and
   * executing the arguments filled function with validation feedback.
   *
   * In that case, this `execute` system prompt would be used. You can
   * customize it by assigning this function with the given
   * {@link INestiaAgentPrompt histories} parameter.
   *
   * @param histories Histories of the previous prompts
   * @returns execute system prompt
   * https://github.com/samchon/nestia/blob/master/packages/agent/prompts/execute.md
   */
  execute?: (histories: INestiaAgentPrompt[]) => string;

  /**
   * Describe system prompt.
   *
   * The {@link NestiaAgent} has a process describing the return values of
   * the executed functions by requesting to the A.I. agent with the
   * previous prompt histories.
   *
   * In that case, this `describe` system prompt would be used. You can
   * customize it by assigning this function with the given
   * {@link INestiaAgentPrompt histories} parameter.
   *
   * @param histories Histories of the previous prompts
   * @returns describe system prompt
   * @default https://github.com/samchon/nestia/blob/master/packages/agent/prompts/describe.md
   */
  describe?: (histories: INestiaAgentPrompt.IExecute[]) => string;
}
