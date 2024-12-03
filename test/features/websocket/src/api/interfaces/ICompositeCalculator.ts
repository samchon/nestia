import { IScientificCalculator } from "./IScientificCalculator";
import { ISimpleCalculator } from "./ISimpleCalculator";
import { IStatisticsCalculator } from "./IStatisticsCalculator";

export interface ICompositeCalculator extends ISimpleCalculator {
  scientific: IScientificCalculator;
  statistics: IStatisticsCalculator;
}
