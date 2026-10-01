import { Driver } from "tgrid";

import { ICalcConfigWebsocket } from "../interfaces/ICalcConfigWebsocket";
import { ICalcEventListenerWebsocket } from "../interfaces/ICalcEventListenerWebsocket";

export abstract class CalculatorBase {
  public constructor(
    private readonly config: ICalcConfigWebsocket,
    private readonly listener: Driver<ICalcEventListenerWebsocket>,
  ) {}

  protected compute(type: string, input: number[], output: number): number {
    const pow: number = Math.pow(10, this.config.precision);
    output = Math.round(output * pow) / pow;
    this.listener.on({ type, input, output }).catch(() => {});
    return output;
  }
}
