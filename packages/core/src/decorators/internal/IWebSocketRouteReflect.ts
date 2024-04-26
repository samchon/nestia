export interface IWebSocketRouteReflect {
  paths: string[];
}
export namespace IWebSocketRouteReflect {
  export type IArgument = IAcceptor | IDriver | IHeader | IParam | IQuery;
  export interface IAcceptor extends IBase<"acceptor"> {}
  export interface IDriver extends IBase<"driver"> {}
  export interface IHeader extends IBase<"header"> {
    validate: (input?: any) => Error | null;
  }
  export interface IParam extends IBase<"param"> {
    field: string;
    assert: (value: string) => any;
  }
  export interface IQuery extends IBase<"query"> {
    validate: (input: URLSearchParams) => any | Error;
  }

  interface IBase<Category extends string> {
    category: Category;
    index: number;
  }
}
