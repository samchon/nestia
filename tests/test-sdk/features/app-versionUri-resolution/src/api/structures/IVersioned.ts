export interface IVersioned {
  version: string;
  id: string | null;
}
export namespace IVersioned {
  export interface IProvider {
    version(): string;
  }
}
