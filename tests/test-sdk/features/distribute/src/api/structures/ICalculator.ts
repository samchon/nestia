export interface ICalculator {
  plus(x: number, y: number): number;
}
export namespace ICalculator {
  export interface IInput {
    x: number;
    y: number;
  }
  export interface IOutput {
    value: number;
  }
}
