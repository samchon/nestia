import { IJsDocTagInfo } from "typia";

import { IReflectType } from "./IReflectType";
import { IReflectTypeImport } from "./IReflectTypeImport";

export type IReflectWebSocketOperationParameter =
  | IReflectWebSocketOperationParameter.IAcceptor
  | IReflectWebSocketOperationParameter.IDriver
  | IReflectWebSocketOperationParameter.IHeader
  | IReflectWebSocketOperationParameter.IParam
  | IReflectWebSocketOperationParameter.IQuery;
export namespace IReflectWebSocketOperationParameter {
  export type IAcceptor = IBase<"acceptor">;
  export type IDriver = IBase<"driver">;
  export type IHeader = IBase<"header">;
  export type IQuery = IBase<"query">;
  export interface IParam extends IBase<"param"> {
    field: string;
  }
  interface IBase<Kind extends string> {
    kind: Kind;
    name: string;
    index: number;
    type: IReflectType;
    imports: IReflectTypeImport[];
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
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
