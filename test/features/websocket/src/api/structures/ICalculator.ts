import { IQuery } from "./IQuery";

export interface ICalculator {
  getId(): string;
  getQuery(): IQuery;
  getPrecision(): number;

  plus(x: number, y: number): number;
  minus(x: number, y: number): number;
  multiply(x: number, y: number): number;
  divide(x: number, y: number): number;
}
