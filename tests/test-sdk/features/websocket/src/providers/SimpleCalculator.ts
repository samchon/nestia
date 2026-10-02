import { ISimpleCalculator } from "../api/interfaces/ISimpleCalculator";
import { CalculatorBase } from "./CalculatorBase";

export class SimpleCalculator
  extends CalculatorBase
  implements ISimpleCalculator
{
  public plus(x: number, y: number): number {
    return this.compute("plus", [x, y], x + y);
  }
  public minus(x: number, y: number): number {
    return this.compute("minus", [x, y], x - y);
  }
  public multiplies(x: number, y: number): number {
    return this.compute("multiplies", [x, y], x * y);
  }
  public divides(x: number, y: number): number {
    return this.compute("divides", [x, y], x / y);
  }
}
