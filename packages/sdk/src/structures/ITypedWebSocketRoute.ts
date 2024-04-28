import { IReflectController } from "./IReflectController";
import { IReflectWebSocketOperation } from "./IReflectWebSocketOperation";
import { ITypeTuple } from "./ITypeTuple";

export interface ITypedWebSocketRoute {
  protocol: "websocket";
  controller: IReflectController;
  name: string;
  path: string;

  accessors: string[];
  parameters: ITypedWebSocketRoute.IParameter[];
  imports: [string, string[]][];

  location: string;
  description?: string;
}
export namespace ITypedWebSocketRoute {
  export type IParameter =
    | IAcceptorParameter
    | IDriverParameter
    | IHeaderParameter
    | IPathParameter
    | IQueryParameter;
  export interface IAcceptorParameter
    extends Omit<IReflectWebSocketOperation.IParameter, "category"> {
    category: "acceptor";
    header: ITypeTuple;
    provider: ITypeTuple;
    remote: ITypeTuple;
  }
  export interface IDriverParameter
    extends Omit<IReflectWebSocketOperation.IParameter, "category"> {
    category: "driver";
    type: string;
    typeName: string;
  }
  export interface IHeaderParameter
    extends Omit<IReflectWebSocketOperation.IParameter, "header"> {
    category: "header";
    type: string;
    typeName: string;
  }
  export interface IPathParameter
    extends Omit<IReflectWebSocketOperation.IParameter, "path"> {
    category: "path";
    type: string;
    typeName: string;
  }
  export interface IQueryParameter
    extends Omit<IReflectWebSocketOperation.IParameter, "query"> {
    category: "query";
    type: string;
    typeName: string;
  }
}
