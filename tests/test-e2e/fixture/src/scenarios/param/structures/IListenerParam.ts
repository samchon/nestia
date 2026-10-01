export interface IListenerParam {
  on(event: IListenerParam.IEventParam): void;
}
export namespace IListenerParam {
  export interface IEventParam {
    operator: "plus" | "minus" | "multiply" | "divide";
    x: number;
    y: number;
    z: number;
  }
}
