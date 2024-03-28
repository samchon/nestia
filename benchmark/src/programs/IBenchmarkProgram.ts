export interface IBenchmarkProgram<T> {
  skip(type: string): boolean;
  validate(input: T): boolean;
  measure(input: T): Promise<IBenchmarkProgram.IMeasurement>;
}
export namespace IBenchmarkProgram {
  export interface IMeasurement {
    amount: number; // bytes
    time: number; // milliseconds
  }
}
