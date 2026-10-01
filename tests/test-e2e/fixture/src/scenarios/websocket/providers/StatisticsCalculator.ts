import { IStatisticsCalculatorWebsocket } from "../interfaces/IStatisticsCalculatorWebsocket";
import { CalculatorBase } from "./CalculatorBase";

export class StatisticsCalculator
  extends CalculatorBase
  implements IStatisticsCalculatorWebsocket
{
  public mean(...values: number[]): number {
    const sum: number = values.reduce((x, y) => x + y);
    return this.compute("mean", values, sum / values.length);
  }
  public stdev(...values: number[]): number {
    const mean: number = values.reduce((x, y) => x + y) / values.length;
    const sum: number = values.reduce((x, y) => x + Math.pow(y - mean, 2));
    return this.compute("stdev", values, Math.sqrt(sum / values.length));
  }
}
