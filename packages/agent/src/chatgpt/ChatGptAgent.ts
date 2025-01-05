import { IHttpLlmFunction } from "@samchon/openapi";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { INestiaChatAgent } from "../structures/INestiaChatAgent";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatFunctionPrompt } from "../structures/INestiaChatFunctionPrompt";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatSelectionApplication } from "../structures/internal/__IChatSelectionApplication";
import { MapUtil } from "../utils/MapUtil";
import { ChatGptFunctionCaller } from "./ChatGptFunctionCaller";
import { ChatGptFunctionSelector } from "./ChatGptFunctionSelector";
import { ChatGptInitializer } from "./ChatGptInitializer";
import { ChatGptReturnValueDescriber } from "./ChatGptReturnValueDescriber";

export class ChatGptAgent implements INestiaChatAgent {
  private readonly histories_: INestiaChatPrompt[];
  private readonly stack_: Map<string, ChatGptFunctionSelector.IStackItem>;
  private readonly listeners_: Map<string, Set<Function>>;

  private readonly divide_?: IHttpLlmFunction<"chatgpt">[][] | undefined;
  private initialized_: boolean;

  public constructor(private readonly props: NestiaChatAgent.IProps) {
    this.stack_ = new Map();
    this.histories_ = props.histories ? [...props.histories] : [];
    this.listeners_ = new Map();
    this.initialized_ = false;
    if (
      !!props.config?.capacity &&
      props.application.functions.length > props.config.capacity
    ) {
      const entireFunctions: IHttpLlmFunction<"chatgpt">[] =
        props.application.functions
          .map((value) => ({ value, sequence: Math.random() }))
          .sort((a, b) => a.sequence - b.sequence)
          .map((elem) => elem.value);
      this.divide_ = new Array(
        Math.ceil(props.application.functions.length / props.config.capacity),
      )
        .fill(0)
        .map(() => entireFunctions.splice(0, props.config!.capacity!));
    }
  }

  public getHistories(): INestiaChatPrompt[] {
    return this.histories_;
  }

  public async conversate(content: string): Promise<INestiaChatPrompt[]> {
    const index: number = this.histories_.length;
    const out = () => this.histories_.slice(index);

    // FUNCTIONS ARE NOT LISTED YET
    if (this.initialized_ === false) {
      const output: ChatGptInitializer.IOutput =
        await ChatGptInitializer.execute({
          service: this.props.service,
          histories: this.histories_,
          content,
        });
      this.initialized_ ||= output.mounted;
      this.histories_.push(...output.prompts);
      if (this.initialized_ === false) return out();
      else this.dispatch({ type: "initialize" });
    }

    // SELECT CANDIDATE FUNCTIONS
    this.histories_.push(
      ...(await ChatGptFunctionSelector.execute({
        application: this.props.application,
        service: this.props.service,
        histories: this.histories_,
        stack: this.stack_,
        content,
        dispatch: (event) => this.dispatch(event),
        divide: this.divide_,
        eliticism: true,
      })),
    );
    if (this.stack_.size === 0) return out();

    // CALL FUNCTIONS
    while (true) {
      const prompts: INestiaChatPrompt[] = await ChatGptFunctionCaller.execute({
        connection: this.props.connection,
        service: this.props.service,
        histories: this.histories_,
        application: this.props.application,
        functions: Array.from(this.stack_.values()).map(
          (item) => item.function,
        ),
        dispatch: (event) => this.dispatch(event),
        content,
        retry: 0,
      });
      this.histories_.push(...prompts);

      // EXPLAIN RETURN VALUES
      const calls: INestiaChatFunctionPrompt[] = prompts.filter(
        (p) => p.kind === "function",
      );
      for (const c of calls)
        ChatGptFunctionSelector.cancelFunction({
          stack: this.stack_,
          reference: {
            name: c.function.name,
            reason: "completed",
          },
          dispatch: (event) => this.dispatch(event),
        });
      this.histories_.push(
        ...(await ChatGptReturnValueDescriber.execute({
          service: this.props.service,
          histories: calls,
        })),
      );
      if (calls.length === 0 || this.stack_.size === 0) break;
    }
    return out();
  }

  public on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void,
  ): void {
    MapUtil.take(this.listeners_, type, () => new Set()).add(listener);
  }

  private dispatch<Event extends INestiaChatEvent>(event: Event): void {
    const set: Set<Function> | undefined = this.listeners_.get(event.type);
    if (set) for (const fn of set) fn(event);
  }
}
