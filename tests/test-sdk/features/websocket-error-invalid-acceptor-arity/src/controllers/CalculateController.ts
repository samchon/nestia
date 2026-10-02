import core from "@nestia/core";
import { Controller } from "@nestjs/common";

interface WebSocketAcceptor<T> {
  value: T;
}

/**
 * Verifies an invalid WebSocket acceptor reports its public configuration
 * error.
 *
 * Why: A one-argument local type bypasses TypeScript's tgrid generic arity
 * check. It shares tgrid's name only, and the acceptor is recognized by its
 * type rather than its spelling (#1671), so it must be rejected as not being
 * tgrid's acceptor rather than corrupt the generated route.
 *
 * 1. Decorate a route with a locally declared one-argument WebSocketAcceptor.
 * 2. Require the SDK CLI fixture to report the acceptor type diagnostic.
 */
@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<string>,
  ): Promise<void> {
    acceptor;
  }
}
