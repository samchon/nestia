import { INestiaChatEvent } from "./INestiaChatEvent";
import { INestiaChatPrompt } from "./INestiaChatPrompt";

export interface INestiaChatAgent {
  conversate(content: string): Promise<INestiaChatPrompt[]>;
  getHistories(): INestiaChatPrompt[];
  on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void,
  ): void;
}
