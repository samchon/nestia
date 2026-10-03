import { ISocketScientificCalculator } from "../../../structures/options/socket_calculator/ISocketScientificCalculator";
import { SocketCalculatorBase } from "./SocketCalculatorBase";

export class SocketScientificCalculator
  extends SocketCalculatorBase
  implements ISocketScientificCalculator
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
