import { Driver } from "tgrid";

import { ISocketCalcConfig } from "../../../structures/options/socket_calculator/ISocketCalcConfig";
import { ISocketCalcEventListener } from "../../../structures/options/socket_calculator/ISocketCalcEventListener";
import { ISocketCompositeCalculator } from "../../../structures/options/socket_calculator/ISocketCompositeCalculator";
import { SocketScientificCalculator } from "./SocketScientificCalculator";
import { SocketSimpleCalculator } from "./SocketSimpleCalculator";
import { SocketStatisticsCalculator } from "./SocketStatisticsCalculator";

export class SocketCompositeCalculator
  extends SocketSimpleCalculator
  implements ISocketCompositeCalculator
{
  public readonly scientific: SocketScientificCalculator;
  public readonly statistics: SocketStatisticsCalculator;

  public constructor(
    config: ISocketCalcConfig,
    listener: Driver<ISocketCalcEventListener>,
  ) {
    super(config, listener);
    this.scientific = new SocketScientificCalculator(config, listener);
    this.statistics = new SocketStatisticsCalculator(config, listener);
  }
}
