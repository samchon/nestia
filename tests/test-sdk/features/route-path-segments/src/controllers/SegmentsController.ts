import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { ISegmentEcho } from "../api/structures/ISegmentEcho";

/** Path parameters that share their segment with literal text or a name. */
@Controller("segments")
export class SegmentsController {
  /** A parameter followed by a literal in its segment. */
  @core.TypedRoute.Get("files/:id.json")
  public file(@core.TypedParam("id") id: string): ISegmentEcho {
    return { values: [id] };
  }

  /** Two parameters parted by a literal inside one segment. */
  @core.TypedRoute.Get("range/:from-:to")
  public range(
    @core.TypedParam("from") from: string,
    @core.TypedParam("to") to: string,
  ): ISegmentEcho {
    return { values: [from, to] };
  }

  /** `:id` is a prefix of `:identity`, which the path writes first. */
  @core.TypedRoute.Get("pair/:identity/:id")
  public pair(
    @core.TypedParam("id") id: string,
    @core.TypedParam("identity") identity: string,
  ): ISegmentEcho {
    return { values: [identity, id] };
  }

  /** The same names in the other order. */
  @core.TypedRoute.Get("reverse/:id/:identity")
  public reverse(
    @core.TypedParam("identity") identity: string,
    @core.TypedParam("id") id: string,
  ): ISegmentEcho {
    return { values: [id, identity] };
  }

  @core.WebSocketRoute("socket/:id.json")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, ISegmentEcho.IProvider, null>,
    @core.WebSocketRoute.Param("id") id: string,
  ): Promise<void> {
    await acceptor.accept({ get: () => ({ values: [id] }) });
  }
}
