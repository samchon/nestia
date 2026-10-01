import { Driver } from "tgrid";

import { ICalcConfigWebsocket } from "../interfaces/ICalcConfigWebsocket";
import { ICalcEventListenerWebsocket } from "../interfaces/ICalcEventListenerWebsocket";
import { ICompositeCalculatorWebsocket } from "../interfaces/ICompositeCalculatorWebsocket";
import { ScientificCalculator } from "./ScientificCalculator";
import { SimpleCalculator } from "./SimpleCalculator";
import { StatisticsCalculator } from "./StatisticsCalculator";

export class CompositeCalculator
  extends SimpleCalculator
  implements ICompositeCalculatorWebsocket
{
  public readonly scientific: ScientificCalculator;
  public readonly statistics: StatisticsCalculator;

  public constructor(
    config: ICalcConfigWebsocket,
    listener: Driver<ICalcEventListenerWebsocket>,
  ) {
    super(config, listener);
    this.scientific = new ScientificCalculator(config, listener);
    this.statistics = new StatisticsCalculator(config, listener);
  }
}
