import { ISocketCalcEvent } from "./ISocketCalcEvent";

export interface ISocketCalcEventListener {
  on(event: ISocketCalcEvent): void;
}
