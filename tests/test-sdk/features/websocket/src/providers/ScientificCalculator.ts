import { IScientificCalculator } from "../api/interfaces/IScientificCalculator";
import { CalculatorBase } from "./CalculatorBase";

export class ScientificCalculator
  extends CalculatorBase
  implements IScientificCalculator
{
  public pow(x: number, y: number): number {
    return this.compute("pow", [x, y], Math.pow(x, y));
  }
  public sqrt(x: number): number {
    return this.compute("sqrt", [x], Math.sqrt(x));
  }
  public log(x: number, base: number): number {
    return this.compute("log", [x, base], Math.log(x) / Math.log(base));
  }
}
