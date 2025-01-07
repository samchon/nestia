import { INestiaChatTokenUsage } from "./INestiaChatCost";
import { INestiaChatEvent } from "./INestiaChatEvent";
import { INestiaChatPrompt } from "./INestiaChatPrompt";

export interface INestiaChatAgent {
  conversate(content: string): Promise<INestiaChatPrompt[]>;

  getHistories(): INestiaChatPrompt[];

  getTokenUsage(): INestiaChatTokenUsage;

  on<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void | Promise<void>,
  ): void;

  off<Type extends INestiaChatEvent.Type>(
    type: Type,
    listener: (event: INestiaChatEvent.Mapper[Type]) => void | Promise<void>,
  ): void;
}
