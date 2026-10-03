import { ISocketScientificCalculator } from "./ISocketScientificCalculator";
import { ISocketSimpleCalculator } from "./ISocketSimpleCalculator";
import { ISocketStatisticsCalculator } from "./ISocketStatisticsCalculator";

export interface ISocketCompositeCalculator extends ISocketSimpleCalculator {
  scientific: ISocketScientificCalculator;
  statistics: ISocketStatisticsCalculator;
}
