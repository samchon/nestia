export interface IRequestValidateListener {
  on(event: IRequestValidateListener.IEvent): void;
}
export namespace IRequestValidateListener {
  export interface IEvent {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
