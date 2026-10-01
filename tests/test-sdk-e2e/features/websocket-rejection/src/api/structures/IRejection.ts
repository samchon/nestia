export namespace IRejection {
  export interface IHeader {
    name: string;
  }
  export interface IQuery {
    count: number;
  }
  export interface IProvider {
    echo(value: string): string;
    hang(): Promise<void>;
    trigger(): void;
  }
}
