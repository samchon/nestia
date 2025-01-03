export interface INestiaChatTextPrompt {
  kind: "text";
  role: "assistant" | "user";
  text: string;
}
