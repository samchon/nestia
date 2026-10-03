export interface IQueryFieldsListener {
  on(event: IQueryFieldsListener.IEvent): void;
}
export namespace IQueryFieldsListener {
  export interface IEvent {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
