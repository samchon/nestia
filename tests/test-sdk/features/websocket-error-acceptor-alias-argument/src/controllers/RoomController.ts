import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

export interface IRoom<Member> {
  members(): Member[];
}

/**
 * A generic alias using its type parameter inside an acceptor type argument.
 *
 * The type is tgrid's acceptor, so the transform accepts it and the route
 * serves, but the generated client needs the provider type written out, and
 * `IRoom<Member>` names the alias's parameter rather than what the route passes
 * for it. The SDK must say so instead of writing an unresolved `Member`.
 */
export type RoomAcceptor<Member> = WebSocketAcceptor<null, IRoom<Member>, null>;

@Controller("room")
export class RoomController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor() acceptor: RoomAcceptor<string>,
  ): Promise<void> {
    await acceptor.accept({ members: () => [] });
  }
}
