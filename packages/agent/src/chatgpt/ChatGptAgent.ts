import { NestiaChatAgent } from "../NestiaChatAgent";
import { INestiaChatAgent } from "../structures/INestiaChatAgent";
import { INestiaChatFunctionPrompt } from "../structures/INestiaChatFunctionPrompt";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatSelectionApplication } from "../structures/internal/__IChatSelectionApplication";
import { ChatGptFunctionCaller } from "./ChatGptFunctionCaller";
import { ChatGptFunctionSelector } from "./ChatGptFunctionSelector";
import { ChatGptInitializer } from "./ChatGptInitializer";
import { ChatGptReturnValueDescriber } from "./ChatGptReturnValueDescriber";

export class ChatGptAgent implements INestiaChatAgent {
  private readonly histories: INestiaChatPrompt[];
  private readonly stack: Map<string, ChatGptFunctionSelector.IStackItem>;
  private initialized: boolean;

  public constructor(private readonly props: NestiaChatAgent.IProps) {
    this.stack = new Map();
    this.initialized = false;
    this.histories = props.histories ? [...props.histories] : [];
  }

  public getHistories(): INestiaChatPrompt[] {
    return this.histories;
  }

  public async conversate(content: string): Promise<INestiaChatPrompt[]> {
    const index: number = this.histories.length;
    const out = () => this.histories.slice(index);

    // FUNCTIONS ARE NOT LISTED YET
    if (this.initialized === false) {
      const output: ChatGptInitializer.IOutput =
        await ChatGptInitializer.execute({
          service: this.props.service,
          histories: this.histories,
          content,
        });
      this.initialized ||= output.mounted;
      this.histories.push(...output.prompts);
      return out();
    }

    // SELECT CANDIDATE FUNCTIONS
    this.histories.push(
      ...(await ChatGptFunctionSelector.execute({
        application: this.props.application,
        service: this.props.service,
        histories: this.histories,
        stack: this.stack,
        content,
      })),
    );
    if (this.stack.size === 0) return out();

    // CALL FUNCTIONS
    const calls: INestiaChatFunctionPrompt[] =
      await ChatGptFunctionCaller.execute({
        connection: this.props.connection,
        service: this.props.service,
        histories: this.histories,
        application: this.props.application,
        functions: Array.from(this.stack.values()).map((item) => item.function),
        content,
        retry: 0,
      });
    this.histories.push(...calls);

    // EXPLAIN RETURN VALUES
    if (calls.length)
      this.histories.push(
        ...(await ChatGptReturnValueDescriber.execute({
          service: this.props.service,
          histories: calls,
        })),
      );
    return out();
  }
}
