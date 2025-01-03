import { INestiaChatPrompt } from "./INestiaChatPrompt";

export interface INestiaChatAgent {
  conversate(content: string): Promise<INestiaChatPrompt[]>;
  getHistories(): INestiaChatPrompt[];
}
