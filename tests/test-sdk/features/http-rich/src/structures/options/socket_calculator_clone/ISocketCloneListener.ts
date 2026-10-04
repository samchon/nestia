export interface ISocketCloneListener {
  on(event: ISocketCloneListener.IEvent): void;
}
export namespace ISocketCloneListener {
  export interface IEvent {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
