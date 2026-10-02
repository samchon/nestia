export interface IQueryProbe {
  name: string;
  query: IQueryProbe.IQuery;
}
export namespace IQueryProbe {
  export interface IQuery {
    q?: string;
    r?: string;
  }

  export interface IProvider {
    get(): IQueryProbe;
  }
}
