import { IHttpConnection, IHttpLlmApplication } from "@samchon/openapi";

import { ChatGptAgent } from "./chatgpt/ChatGptAgent";
import { IChatGptService } from "./structures/IChatGptService";
import { INestiaChatAgent } from "./structures/INestiaChatAgent";
import { INestiaChatPrompt } from "./structures/INestiaChatPrompt";

export class NestiaChatAgent implements INestiaChatAgent {
  private readonly agent: ChatGptAgent;

  public constructor(props: NestiaChatAgent.IProps) {
    this.agent = new ChatGptAgent(props);
  }

  public conversate(content: string): Promise<INestiaChatPrompt[]> {
    return this.agent.conversate(content);
  }

  public getHistories(): INestiaChatPrompt[] {
    return this.agent.getHistories();
  }
}
export namespace NestiaChatAgent {
  export interface IProps {
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    histories?: INestiaChatPrompt[];
    connection: IHttpConnection;
  }
}
