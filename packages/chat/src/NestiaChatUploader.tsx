import { IChatGptService } from "@nestia/agent";
import { IHttpConnection } from "@samchon/openapi";

export const NestiaChatUploader = () => {};
export namespace NestiaChatUploader {
  export interface IProps {
    connection?: IHttpConnection;
    service?: IChatGptService;
  }
}
