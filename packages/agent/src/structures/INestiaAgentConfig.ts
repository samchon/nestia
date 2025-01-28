import { INestiaAgentSystemPrompt } from "./INestiaAgentSystemPrompt";

/**
 * Configuration for Nestia Agent.
 *
 * `INestiaAgentConfig` is an interface that defines the configuration
 * properties of the {@link NestiaAgent}. With this configuration, you
 * can set the user's locale, timezone, and some of system prompts.
 *
 * Also, you can affect to the LLM function selecing/calling logic by
 * configuring additional properties. For an example, if you configure the
 * {@link capacity} property, the A.I. chatbot will divide the functions
 * into the several groups with the configured capacity and select proper
 * functions to call by operating the multiple LLM function selecting
 * agents parallelly.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaAgentConfig {
  /**
   * Locale of the A.I. chatbot.
   *
   * If you configure this property, the A.I. chatbot will conversate with
   * the given locale. You can get the locale value by
   *
   * - Browser: `navigator.language`
   * - NodeJS: `process.env.LANG.split(".")[0]`
   *
   * @default your_locale
   */
  locale?: string;

  /**
   * Timezone of the A.I. chatbot.
   *
   * If you configure this property, the A.I. chatbot will consider the
   * given timezone. You can get the timezone value by
   * `Intl.DateTimeFormat().resolvedOptions().timeZone`.
   *
   * @default your_timezone
   */
  timezone?: string;

  /**
   * Retry count.
   *
   * If LLM function calling composed arguments are invalid,
   * the A.I. chatbot will retry to call the function with
   * the modified arguments.
   *
   * By the way, if you configure it to 0 or 1, the A.I. chatbot
   * will not retry the LLM function calling for correcting the
   * arguments.
   *
   * @default 3
   */
  retry?: number;

  /**
   * Capacity of the LLM function selecting.
   *
   * When the A.I. chatbot selects a proper function to call, if the
   * number of functions registered in the
   * {@link INestiaAgentProps.applications} is too much greater,
   * the A.I. chatbot often fallen into the hallucination.
   *
   * In that case, if you configure this property value, `NestiaChatAgent`
   * will divide the functions into the several groups with the configured
   * capacity and select proper functions to call by operating the multiple
   * LLM function selecting agents parallelly.
   *
   * @default 0
   */
  capacity?: number;

  /**
   * Eliticism for the LLM function selecting.
   *
   * If you configure {@link capacity}, the A.I. chatbot will complete
   * the candidate functions to call which are selected by the multiple
   * LLM function selecting agents.
   *
   * Otherwise you configure this property as `false`, the A.I. chatbot
   * will not complete the candidate functions to call and just accept
   * every candidate functions to call which are selected by the multiple
   * LLM function selecting agents.
   *
   * @default true
   */
  eliticism?: boolean;

  /**
   * System prompt messages.
   *
   * System prompt messages if you want to customize the system prompt
   * messages for each situation.
   */
  systemPrompt?: INestiaAgentSystemPrompt;
}
