export interface IListener {
  on(event: IListener.IEvent): void;
}
export namespace IListener {
  export interface IEvent {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
