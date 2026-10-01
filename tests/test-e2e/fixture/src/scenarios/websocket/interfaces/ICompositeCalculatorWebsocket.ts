import { IScientificCalculatorWebsocket } from "./IScientificCalculatorWebsocket";
import { ISimpleCalculatorWebsocket } from "./ISimpleCalculatorWebsocket";
import { IStatisticsCalculatorWebsocket } from "./IStatisticsCalculatorWebsocket";

export interface ICompositeCalculatorWebsocket extends ISimpleCalculatorWebsocket {
  scientific: IScientificCalculatorWebsocket;
  statistics: IStatisticsCalculatorWebsocket;
}
