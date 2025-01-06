import { IHttpConnection, IHttpLlmApplication } from "@samchon/openapi";

import { ChatGptAgent } from "./chatgpt/ChatGptAgent";
import { IChatGptService } from "./structures/IChatGptService";
import { INestiaChatAgent } from "./structures/INestiaChatAgent";
import { INestiaChatEvent } from "./structures/INestiaChatEvent";
import { INestiaChatPrompt } from "./structures/INestiaChatPrompt";

export class NestiaChatAgent implements INestiaChatAgent {
  private readonly agent: INestiaChatAgent;

  public constructor(props: NestiaChatAgent.IProps) {
    this.agent = new ChatGptAgent(props);
  }

  public conversate(content: string): Promise<INestiaChatPrompt[]> {
    return this.agent.conversate(content);
  }

  public getHistories(): INestiaChatPrompt[] {
    return this.agent.getHistories();
  }

  public on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void,
  ): void {
    this.agent.on(type, listener);
  }
}
export namespace NestiaChatAgent {
  export interface IProps {
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    connection: IHttpConnection;
    histories?: INestiaChatPrompt[] | undefined;
    config?: IConfig | undefined;
  }

  export interface IConfig {
    retry?: number;
    capacity?: number;
    eliticism?: boolean;
    systemPrompt?: Partial<ISytemPrompt>;
  }

  export interface ISytemPrompt {
    initial?: (histories: INestiaChatPrompt[]) => string;
    select?: (histories: INestiaChatPrompt[]) => string;
    cancel?: (histories: INestiaChatPrompt[]) => string;
    execute?: (histories: INestiaChatPrompt[]) => string;
    describe?: (histories: INestiaChatPrompt.IExecute[]) => string;
  }
}
