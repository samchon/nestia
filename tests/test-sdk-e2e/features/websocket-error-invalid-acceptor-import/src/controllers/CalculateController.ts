import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Verifies an import type of another module's `WebSocketAcceptor` is rejected
 * as an acceptor.
 *
 * Why: the transform follows an import type such as
 * `import("tgrid").WebSocketAcceptor<...>` to the declaration it names (#1671).
 * One naming a local interface of the same name and arity must still be
 * rejected, as the same interface imported by name is.
 *
 * 1. Decorate a route's acceptor with an import type of a local
 *    `WebSocketAcceptor` taking three type arguments.
 * 2. Require the SDK CLI fixture to report the acceptor type diagnostic.
 */
@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor()
    acceptor: import("../structures/LocalAcceptor").WebSocketAcceptor<
      null,
      null,
      null
    >,
  ): Promise<void> {
    acceptor;
  }
}
