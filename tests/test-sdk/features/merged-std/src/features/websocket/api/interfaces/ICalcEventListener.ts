import { ICalcEvent } from "./ICalcEvent";

export interface ICalcEventListener {
  on(event: ICalcEvent): void;
}
