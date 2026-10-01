import { ICalcEventWebsocket } from "./ICalcEventWebsocket";

export interface ICalcEventListenerWebsocket {
  on(event: ICalcEventWebsocket): void;
}
