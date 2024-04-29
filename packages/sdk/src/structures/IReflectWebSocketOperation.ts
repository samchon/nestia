import { VERSION_NEUTRAL } from "@nestjs/common";

export interface IReflectWebSocketOperation {
  protocol: "websocket";
  target: Function;
  name: string;
  paths: string[];
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectWebSocketOperation.IParameter[];
}
export namespace IReflectWebSocketOperation {
  export interface IParameter {
    category: "acceptor" | "driver" | "header" | "param" | "query";
    field: string;
    index: number;
  }
}
