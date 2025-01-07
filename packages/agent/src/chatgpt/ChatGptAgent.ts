import { IHttpLlmFunction } from "@samchon/openapi";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { INestiaChatAgent } from "../structures/INestiaChatAgent";
import { INestiaChatCost } from "../structures/INestiaChatCost";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatFunctionSelection } from "../structures/INestiaChatFunctionSelection";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatSelectFunctionsApplication } from "../structures/internal/__IChatSelectFunctionsApplication";
import { ChatGptCancelFunctionAgent } from "./ChatGptCancelFunctionAgent";
import { ChatGptDescribeFunctionAgent } from "./ChatGptDescribeFunctionAgent";
import { ChatGptExecuteFunctionAgent } from "./ChatGptExecuteFunctionAgent";
import { ChatGptInitializeFunctionAgent } from "./ChatGptInitializeFunctionAgent";
import { ChatGptSelectFunctionAgent } from "./ChatGptSelectFunctionAgent";

export class ChatGptAgent implements INestiaChatAgent {
  private readonly histories_: INestiaChatPrompt[];
  private readonly stack_: INestiaChatFunctionSelection[];
  private readonly listeners_: Map<string, Set<Function>>;

  private readonly divide_?: IHttpLlmFunction<"chatgpt">[][] | undefined;
  private readonly cost_: INestiaChatCost;
  private initialized_: boolean;

  public constructor(private readonly props: NestiaChatAgent.IProps) {
    this.stack_ = [];
    this.histories_ = props.histories ? [...props.histories] : [];
    this.listeners_ = new Map();

    this.initialized_ = false;
    this.cost_ = {
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

    if (
      !!props.config?.capacity &&
      props.application.functions.length > props.config.capacity
    ) {
      const size: number = Math.ceil(
        props.application.functions.length / props.config.capacity,
      );
      const capacity: number = Math.ceil(
        props.application.functions.length / size,
      );

      const entireFunctions: IHttpLlmFunction<"chatgpt">[] =
        props.application.functions.slice();
      this.divide_ = new Array(size)
        .fill(0)
        .map(() => entireFunctions.splice(0, capacity));
    }
  }

  public getHistories(): INestiaChatPrompt[] {
    return this.histories_;
  }

  public getCost(): INestiaChatCost {
    return this.cost_;
  }

  public async conversate(content: string): Promise<INestiaChatPrompt[]> {
    const index: number = this.histories_.length;
    const out = () => this.histories_.slice(index);

    // FUNCTIONS ARE NOT LISTED YET
    if (this.initialized_ === false) {
      const output: ChatGptInitializeFunctionAgent.IOutput =
        await ChatGptInitializeFunctionAgent.execute({
          service: this.props.service,
          histories: this.histories_,
          config: this.props.config,
          cost: this.cost_,
          content,
        });
      this.initialized_ ||= output.mounted;
      this.histories_.push(...output.prompts);
      if (this.initialized_ === false) return out();
      else this.dispatch({ type: "initialize" });
    }

    // CANCEL CANDIDATE FUNCTIONS
    if (this.stack_.length)
      this.histories_.push(
        ...(await ChatGptCancelFunctionAgent.execute({
          application: this.props.application,
          service: this.props.service,
          histories: this.histories_,
          stack: this.stack_,
          dispatch: (event) => this.dispatch(event),
          config: this.props.config,
          cost: this.cost_,
          content,
        })),
      );

    // SELECT CANDIDATE FUNCTIONS
    this.histories_.push(
      ...(await ChatGptSelectFunctionAgent.execute({
        application: this.props.application,
        service: this.props.service,
        histories: this.histories_,
        stack: this.stack_,
        dispatch: (event) => this.dispatch(event),
        divide: this.divide_,
        config: this.props.config,
        cost: this.cost_,
        content,
      })),
    );
    if (this.stack_.length === 0) return out();

    // CALL FUNCTIONS
    while (true) {
      const prompts: INestiaChatPrompt[] =
        await ChatGptExecuteFunctionAgent.execute({
          connection: this.props.connection,
          service: this.props.service,
          histories: this.histories_,
          application: this.props.application,
          functions: Array.from(this.stack_.values()).map(
            (item) => item.function,
          ),
          dispatch: (event) => this.dispatch(event),
          config: this.props.config,
          cost: this.cost_,
          content,
        });
      this.histories_.push(...prompts);

      // EXPLAIN RETURN VALUES
      const calls: INestiaChatPrompt.IExecute[] = prompts.filter(
        (p) => p.kind === "execute",
      );
      for (const c of calls)
        ChatGptCancelFunctionAgent.cancelFunction({
          stack: this.stack_,
          reference: {
            name: c.function.name,
            reason: "completed",
          },
          dispatch: (event) => this.dispatch(event),
        });
      if (calls.length !== 0)
        this.histories_.push(
          ...(await ChatGptDescribeFunctionAgent.execute({
            service: this.props.service,
            histories: calls,
            config: this.props.config,
            cost: this.cost_,
          })),
        );
      if (calls.length === 0 || this.stack_.length === 0) break;
    }
    return out();
  }

  public on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void,
  ): void {
    take(this.listeners_, type, () => new Set()).add(listener);
  }

  public off<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void,
  ): void {
    const set: Set<Function> | undefined = this.listeners_.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) this.listeners_.delete(type);
    }
  }

  private async dispatch<Event extends INestiaChatEvent>(
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

const take = <Key, T>(dict: Map<Key, T>, key: Key, generator: () => T): T => {
  const oldbie: T | undefined = dict.get(key);
  if (oldbie) return oldbie;

  const value: T = generator();
  dict.set(key, value);
  return value;
};
