import OpenAI from "openai";

/**
 * Service of the ChatGPT (OpenAI) API.
 */
export interface IChatGptService {
  /**
   * OpenAI API instance.
   */
  api: OpenAI;

  /**
   * Chat model to be used.
   */
  model: OpenAI.ChatModel;

  /**
   * Options for the request.
   */
  options?: OpenAI.RequestOptions | undefined;
}
