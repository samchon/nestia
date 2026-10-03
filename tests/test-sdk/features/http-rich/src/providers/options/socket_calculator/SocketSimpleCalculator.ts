import { ISocketSimpleCalculator } from "../../../structures/options/socket_calculator/ISocketSimpleCalculator";
import { SocketCalculatorBase } from "./SocketCalculatorBase";

export class SocketSimpleCalculator
  extends SocketCalculatorBase
  implements ISocketSimpleCalculator
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
