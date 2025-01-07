import { IHttpConnection, IHttpLlmApplication } from "@samchon/openapi";

import { ChatGptAgent } from "./chatgpt/ChatGptAgent";
import { IChatGptService } from "./structures/IChatGptService";
import { INestiaChatAgent } from "./structures/INestiaChatAgent";
import { INestiaChatTokenUsage } from "./structures/INestiaChatCost";
import { INestiaChatEvent } from "./structures/INestiaChatEvent";
import { INestiaChatPrompt } from "./structures/INestiaChatPrompt";

/**
 * Nestia A.I. chatbot agent.
 *
 * `NestiaChatAgent` is a facade class for the A.I. chatbot agent
 * which performs the {@link converstate user's conversation function}
 * with LLM (Large Language Model) function calling and manages the
 * {@link getHistories prompt histories}.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class NestiaChatAgent implements INestiaChatAgent {
  /**
   * @hidden
   */
  private readonly agent: INestiaChatAgent;

  /**
   * Initializer constructor.
   *
   * @param props Properties to construct the agent
   */
  public constructor(props: NestiaChatAgent.IProps) {
    this.agent = new ChatGptAgent(props);
  }

  /**
   * Conversate with the A.I. chatbot.
   *
   * User talks to the A.I. chatbot with the content.
   *
   * When the user's conversation implies the A.I. chatbot to execute a
   * function calling, the returned chat prompts will contain the
   * function calling information like {@link INestiaChatPrompt.IExecute}.
   *
   * @param content The content to talk
   * @returns List of newly created chat prompts
   */
  public conversate(content: string): Promise<INestiaChatPrompt[]> {
    return this.agent.conversate(content);
  }

  /**
   * Get the chatbot's history.
   *
   * Get list of chat prompts that the chatbot has been conversated.
   *
   * @returns List of chat prompts
   */
  public getHistories(): INestiaChatPrompt[] {
    return this.agent.getHistories();
  }

  /**
   * Get token usage of the A.I. chatbot.
   *
   * Entire token usage of the A.I. chatbot during the conversating
   * with the user by {@link conversate} method callings.
   *
   * @returns Cost of the A.I. chatbot
   */
  public getTokenUsage(): INestiaChatTokenUsage {
    return this.agent.getTokenUsage();
  }

  /**
   * Add an event listener.
   *
   * Add an event listener to be called whenever the event is emitted.
   *
   * @param type Type of event
   * @param listener Callback function to be called whenever the event is emitted
   */
  public on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void | Promise<void>,
  ): void {
    this.agent.on(type, listener);
  }

  /**
   * Erase an event listener.
   *
   * Erase an event listener to stop calling the callback function.
   *
   * @param type Type of event
   * @param listener Callback function to erase
   */
  public off<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void | Promise<void>,
  ): void {
    this.agent.off(type, listener);
  }
}
export namespace NestiaChatAgent {
  /**
   * Properties of the A.I. chatbot agent.
   */
  export interface IProps {
    /**
     * Application instance for LLM function calling.
     */
    application: IHttpLlmApplication<"chatgpt">;

    /**
     * Service of the ChatGPT (OpenAI) API.
     */
    service: IChatGptService;

    /**
     * HTTP connection to the backend server.
     */
    connection: IHttpConnection;

    /**
     * Initial chat prompts.
     *
     * If you configure this property, the chatbot will start the
     * pre-defined conversations.
     */
    histories?: INestiaChatPrompt[] | undefined;

    /**
     * Configuration for the A.I. chatbot.
     */
    config?: IConfig | undefined;
  }

  /**
   * Configuration for the A.I. chatbot.
   */
  export interface IConfig {
    /**
     * Locale of the A.I. chatbot.
     *
     * If you configure this property, the A.I. chatbot will conversate with the
     * given locale. You can get the locale value by
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
     * If you configure this property, the A.I. chatbot will consider the given timezone.
     * You can get the timezone value by `Intl.DateTimeFormat().resolvedOptions().timeZone`.
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
     * number of functions registered in the {@link IProps.application}
     * is too much greater, the A.I. chatbot often fallen into the
     * hallucination.
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
    systemPrompt?: ISytemPrompt;
  }

  /**
   * System prompt messages.
   *
   * System prompt messages if you want to customize the system prompt
   * messages for each situation.
   */
  export interface ISytemPrompt {
    common?: (config?: IConfig | undefined) => string;
    initialize?: (histories: INestiaChatPrompt[]) => string;
    select?: (histories: INestiaChatPrompt[]) => string;
    cancel?: (histories: INestiaChatPrompt[]) => string;
    execute?: (histories: INestiaChatPrompt[]) => string;
    describe?: (histories: INestiaChatPrompt.IExecute[]) => string;
  }
}
