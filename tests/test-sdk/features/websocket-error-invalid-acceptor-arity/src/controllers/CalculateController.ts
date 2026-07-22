import core from "@nestia/core";
import { Controller } from "@nestjs/common";

interface WebSocketAcceptor<T> {
  value: T;
}

/**
 * Verifies an invalid WebSocket acceptor reports its public configuration error.
 *
 * Why:
 * A one-argument local type bypasses TypeScript's tgrid generic arity check and
 * reaches Nestia's route analysis, where it must produce a diagnostic rather
 * than corrupt the generated route.
 *
 * 1. Decorate a route with a locally declared one-argument WebSocketAcceptor.
 * 2. Require the SDK CLI fixture to report the acceptor arity diagnostic.
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
