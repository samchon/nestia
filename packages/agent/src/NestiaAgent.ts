import OpenAI from "openai";

import { ChatGptAgent } from "./chatgpt/ChatGptAgent";
import { NestiaAgentCostAggregator } from "./internal/NestiaAgentCostAggregator";
import { NestiaAgentOperationComposer } from "./internal/NestiaAgentOperationComposer";
import { NestiaAgentPromptTransformer } from "./internal/NestiaAgentPromptTransformer";
import { __map_take } from "./internal/__map_take";
import { INestiaAgentConfig } from "./structures/INestiaAgentConfig";
import { INestiaAgentController } from "./structures/INestiaAgentController";
import { INestiaAgentEvent } from "./structures/INestiaAgentEvent";
import { INestiaAgentOperationCollection } from "./structures/INestiaAgentOperationCollection";
import { INestiaAgentOperationSelection } from "./structures/INestiaAgentOperationSelection";
import { INestiaAgentPrompt } from "./structures/INestiaAgentPrompt";
import { INestiaAgentProps } from "./structures/INestiaAgentProps";
import { INestiaAgentProvider } from "./structures/INestiaAgentProvider";
import { INestiaAgentTokenUsage } from "./structures/INestiaAgentTokenUsage";

/**
 * Nestia A.I. chatbot agent.
 *
 * `NestiaChatAgent` is a facade class for the super A.I. chatbot agent
 * which performs the {@link converstate user's conversation function}
 * with LLM (Large Language Model) function calling and manages the
 * {@link getPromptHistories prompt histories}.
 *
 * To understand and compose the `NestiaAgent` class exactly, reference
 * below types concentrating on the documentation comments please.
 * Especially, you have to be careful about the {@link INestiaAgentProps}
 * type which is used in the {@link constructor} function.
 *
 * - Constructors
 *   - {@link INestiaAgentProps}
 *   - {@link INestiaAgentProvider}
 *   - {@link INestiaAgentController}
 *   - {@link INestiaAgentConfig}
 *   - {@link INestiaAgentSystemPrompt}
 * - Accessors
 *   - {@link INestiaAgentOperation}
 *   - {@link INestiaAgentPrompt}
 *   - {@link INestiaAgentEvent}
 *   - {@link INestiaAgentTokenUsage}
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class NestiaAgent {
  // THE OPERATIONS
  private readonly operations_: INestiaAgentOperationCollection;

  // STACK
  private readonly stack_: INestiaAgentOperationSelection[];
  private readonly prompt_histories_: INestiaAgentPrompt[];
  private readonly listeners_: Map<string, Set<Function>>;

  // STATUS
  private readonly token_usage_: INestiaAgentTokenUsage;
  private ready_: boolean;

  /* -----------------------------------------------------------
    CONSTRUCTOR
  ----------------------------------------------------------- */
  /**
   * Initializer constructor.
   *
   * @param props Properties to construct the agent
   */
  public constructor(private readonly props: INestiaAgentProps) {
    // OPERATIONS
    this.operations_ = NestiaAgentOperationComposer.compose({
      controllers: props.controllers,
      config: props.config,
    });

    // STATUS
    this.stack_ = [];
    this.listeners_ = new Map();
    this.prompt_histories_ = (props.histories ?? []).map((input) =>
      NestiaAgentPromptTransformer.transform({
        operations: this.operations_.group,
        input,
      }),
    );

    // STATUS
    this.token_usage_ = {
      total: 0,
      prompt: {
        total: 0,
        audio: 0,
        cached: 0,
      },
      completion: {
        total: 0,
        accepted_prediction: 0,
        audio: 0,
        reasoning: 0,
        rejected_prediction: 0,
      },
    };
    this.ready_ = false;
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  /**
   * Conversate with the A.I. chatbot.
   *
   * User talks to the A.I. chatbot with the content.
   *
   * When the user's conversation implies the A.I. chatbot to execute a
   * function calling, the returned chat prompts will contain the
   * function calling information like {@link INestiaAgentPrompt.IExecute}.
   *
   * @param content The content to talk
   * @returns List of newly created chat prompts
   */
  public async conversate(content: string): Promise<INestiaAgentPrompt[]> {
    const prompt: INestiaAgentPrompt.IText = {
      type: "text",
      role: "user",
      text: content,
    };
    await this.dispatch(prompt);

    const newbie: INestiaAgentPrompt[] = await ChatGptAgent.execute({
      // APPLICATION
      operations: this.operations_,
      config: this.props.config,

      // STATES
      histories: this.prompt_histories_,
      stack: this.stack_,
      ready: () => this.ready_,
      prompt,

      // HANDLERS
      dispatch: (event) => this.dispatch(event),
      request: async (source, body) => {
        // request information
        const event: INestiaAgentEvent.IRequest = {
          type: "request",
          source,
          body: {
            ...body,
            model: this.props.provider.model,
          },
          options: this.props.provider.options,
        };
        await this.dispatch(event);

        // completion
        const value: OpenAI.ChatCompletion =
          await this.props.provider.api.chat.completions.create(
            event.body,
            event.options,
          );
        NestiaAgentCostAggregator.aggregate(this.token_usage_, value);
        await this.dispatch({
          type: "response",
          source,
          body: event.body,
          options: event.options,
          value,
        });
        return value;
      },
      initialize: async () => {
        this.ready_ = true;
        await this.dispatch({
          type: "initialize",
        });
      },
    });
    this.prompt_histories_.push(prompt, ...newbie);
    return [prompt, ...newbie];
  }

  /**
   * Get configuration.
   */
  public getConfig(): INestiaAgentConfig | undefined {
    return this.props.config;
  }

  /**
   * Get LLM Provider.
   */
  public getProvider(): INestiaAgentProvider {
    return this.props.provider;
  }

  /**
   * Get controllers.
   *
   * Get list of controllers, which are the collection of functions that
   * the "Super A.I. Chatbot" can execute.
   */
  public getControllers(): ReadonlyArray<INestiaAgentController> {
    return this.props.controllers;
  }

  /**
   * Get the chatbot's prompt histories.
   *
   * Get list of chat prompts that the chatbot has been conversated.
   *
   * @returns List of chat prompts
   */
  public getPromptHistories(): INestiaAgentPrompt[] {
    return this.prompt_histories_;
  }

  /**
   * Get token usage of the A.I. chatbot.
   *
   * Entire token usage of the A.I. chatbot during the conversating
   * with the user by {@link conversate} method callings.
   *
   * @returns Cost of the A.I. chatbot
   */
  public getTokenUsage(): INestiaAgentTokenUsage {
    return this.token_usage_;
  }

  /* -----------------------------------------------------------
    EVENT HANDLERS
  ----------------------------------------------------------- */
  /**
   * Add an event listener.
   *
   * Add an event listener to be called whenever the event is emitted.
   *
   * @param type Type of event
   * @param listener Callback function to be called whenever the event is emitted
   */
  public on<Type extends INestiaAgentEvent.Type>(
    type: Type,
    listener: (event: INestiaAgentEvent.Mapper[Type]) => void | Promise<void>,
  ): void {
    __map_take(this.listeners_, type, () => new Set()).add(listener);
  }

  /**
   * Erase an event listener.
   *
   * Erase an event listener to stop calling the callback function.
   *
   * @param type Type of event
   * @param listener Callback function to erase
   */
  public off<Type extends INestiaAgentEvent.Type>(
    type: Type,
    listener: (event: INestiaAgentEvent.Mapper[Type]) => void | Promise<void>,
  ): void {
    const set: Set<Function> | undefined = this.listeners_.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) this.listeners_.delete(type);
    }
  }

  private async dispatch<Event extends INestiaAgentEvent>(
    event: Event,
  ): Promise<void> {
    const set: Set<Function> | undefined = this.listeners_.get(event.type);
    if (set)
      await Promise.all(
        Array.from(set).map(async (listener) => {
          try {
            await listener(event);
          } catch {}
        }),
      );
  }
}
