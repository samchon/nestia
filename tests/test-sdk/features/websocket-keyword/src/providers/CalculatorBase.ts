import { Driver } from "tgrid";

import { ICalcConfig } from "../api/interfaces/ICalcConfig";
import { ICalcEventListener } from "../api/interfaces/ICalcEventListener";

export abstract class CalculatorBase {
  public constructor(
    private readonly config: ICalcConfig,
    private readonly listener: Driver<ICalcEventListener>,
  ) {}

  protected compute(type: string, input: number[], output: number): number {
    const pow: number = Math.pow(10, this.config.precision);
    output = Math.round(output * pow) / pow;
    this.listener.on({ type, input, output }).catch(() => {});
    return output;
  }
}
