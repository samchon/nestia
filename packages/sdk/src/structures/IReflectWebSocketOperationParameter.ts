import { IReflectType } from "./IReflectType";

export type IReflectWebSocketOperationParameter =
  | IReflectWebSocketOperationParameter.IAcceptorParameter
  | IReflectWebSocketOperationParameter.IDriverParameter
  | IReflectWebSocketOperationParameter.IHeaderParameter
  | IReflectWebSocketOperationParameter.IParamParameter
  | IReflectWebSocketOperationParameter.IQueryParameter;
export namespace IReflectWebSocketOperationParameter {
  export type IAcceptorParameter = IBase<"acceptor">;
  export type IDriverParameter = IBase<"driver">;
  export type IHeaderParameter = IBase<"header">;
  export type IQueryParameter = IBase<"query">;
  export interface IParamParameter extends IBase<"param"> {
    field: string;
  }
  interface IBase<Kind extends string> {
    kind: Kind;
    name: string;
    index: number;
    type: IReflectType;
  }

  /**
   * @internal
   */
  export interface IPreconfigured {
    kind: "acceptor" | "driver" | "header" | "param" | "query";
    index: number;
    field?: string;
  }
}
