export interface IParameterFieldsListener {
  on(event: IParameterFieldsListener.IEvent): void;
}
export namespace IParameterFieldsListener {
  export interface IEvent {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
