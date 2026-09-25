import core from "@nestia/core";
import { Controller, MessageEvent, Sse } from "@nestjs/common";
import { Observable, of } from "rxjs";

@Controller("events")
export class EventController {
  @Sse("stream")
  public stream(): Observable<MessageEvent> {
    return of({ data: { value: 1 } });
  }

  @core.TypedRoute.Get("count")
  public count(): number {
    return 1;
  }
}
