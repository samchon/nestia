import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

/**
 * Returns the original customized error message through either HTTP adapter.
 *
 * @evidence contracts/common.md#principled-implementation Method-local HttpException matching preserves each exception status and replaces its response with the same message. The public constructor receives the framework-owned HttpAdapterHost resolved by Nest for this enhancer and stores it in a private readonly parameter property.
 * @evidence contracts/common.md#clear-and-simple-design One borrowed constructor reference supplies Nest's active adapter for this application; catch delegates its reply without acquiring a second server.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public adapter reply handles Express and Fastify without foreign response patching or global filters. Nest owns the injected adapter; no global provider is replaced.
 * @evidence contracts/common.md#meaningful-documentation The filter documents its local response replacement, immutable message and constructor injection ownership. Native constructor prose identifies the borrowed reply owner.
 */
@Catch(HttpException)
export class CoreBoundaryHttpExceptionFilter implements ExceptionFilter {
  /** Original filter response text. */
  public static readonly MESSAGE = "Customized error message.";
  /** Acquires the application-owned HTTP adapter. */
  constructor(private readonly adapter: HttpAdapterHost) {}
  /**
   * Preserves status while replacing the exception body.
   *
   * @evidence contracts/common.md#principled-implementation HttpException supplies the status and the authored MESSAGE supplies the response oracle.
   * @evidence contracts/common.md#clear-and-simple-design One public adapter call writes the response.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No route name, exception subclass or expected status is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The method states the status/body distinction.
   */
  public catch(exception: HttpException, host: ArgumentsHost): void {
    this.adapter.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      CoreBoundaryHttpExceptionFilter.MESSAGE,
      exception.getStatus(),
    );
  }
}
