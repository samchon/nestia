import { Driver } from "tgrid";

import { ISocketCalcConfig } from "../../../structures/options/socket_calculator/ISocketCalcConfig";
import { ISocketCalcEventListener } from "../../../structures/options/socket_calculator/ISocketCalcEventListener";

export abstract class SocketCalculatorBase {
  public constructor(
    private readonly config: ISocketCalcConfig,
    private readonly listener: Driver<ISocketCalcEventListener>,
  ) {}

  protected compute(type: string, input: number[], output: number): number {
    const pow: number = Math.pow(10, this.config.precision);
    output = Math.round(output * pow) / pow;
    this.listener.on({ type, input, output }).catch(() => {});
    return output;
  }
}
