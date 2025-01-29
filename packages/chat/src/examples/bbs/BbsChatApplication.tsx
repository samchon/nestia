import { NestiaAgent } from "@nestia/agent";
import OpenAI from "openai";
import typia from "typia";

import { NestiaChatApplication } from "../../NestiaChatApplication";
import { BbsArticleService } from "./BbsArticleService";

export const BbsChatApplication = (props: BbsChatApplication.IProps) => {
  const service: BbsArticleService = new BbsArticleService();
  const agent: NestiaAgent = new NestiaAgent({
    provider: {
      type: "chatgpt",
      api: new OpenAI({
        apiKey: props.apiKey,
        dangerouslyAllowBrowser: true,
      }),
      model: props.model ?? "gpt-4o-mini",
    },
    controllers: [
      {
        protocol: "class",
        name: "bbs",
        application: typia.llm.applicationOfValidate<
          BbsArticleService,
          "chatgpt"
        >(),
        execute: async (props) => {
          return (service as any)[props.function.name](props.arguments);
        },
      },
    ],
    config: {
      locale: props.locale,
      timezone: props.timezone,
    },
  });
  return <NestiaChatApplication agent={agent} />;
};
export namespace BbsChatApplication {
  export interface IProps {
    apiKey: string;
    model?: OpenAI.ChatModel;
    locale?: string;
    timezone?: string;
  }
}
