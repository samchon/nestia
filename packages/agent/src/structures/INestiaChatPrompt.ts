import { INestiaChatFunctionPrompt } from "./INestiaChatFunctionPrompt";
import { INestiaChatTextPrompt } from "./INestiaChatTextPrompt";

export type INestiaChatPrompt =
  | INestiaChatFunctionPrompt
  | INestiaChatTextPrompt;
