export interface ISocketTypesQueryProbe {
  name: string;
  query: ISocketTypesQueryProbe.IQuery;
}
export namespace ISocketTypesQueryProbe {
  export interface IQuery {
    q?: string;
    r?: string;
  }

  export interface IProvider {
    get(): ISocketTypesQueryProbe;
  }
}
