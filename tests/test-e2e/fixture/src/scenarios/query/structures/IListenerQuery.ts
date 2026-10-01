export interface IListenerQuery {
  on(event: IListenerQuery.IEventQuery): void;
}
export namespace IListenerQuery {
  export interface IEventQuery {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
