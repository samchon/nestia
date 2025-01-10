import { IChatGptService } from "@nestia/agent";
import { IHttpConnection, OpenApi } from "@samchon/openapi";

export const NestiaChatApplication = () => {};
export namespace NestiaChatApplication {
  export interface IProps {
    swagger?: string | OpenApi.IDocument;
    connection?: IHttpConnection;
    service?: IChatGptService;
  }
}
