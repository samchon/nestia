import OpenAI from "openai";

export interface IChatGptService {
  api: OpenAI;
  model: OpenAI.ChatModel;
  options?: OpenAI.RequestOptions | undefined;
}
