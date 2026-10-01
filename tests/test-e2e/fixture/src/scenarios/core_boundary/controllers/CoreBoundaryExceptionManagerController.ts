import core from "@nestia/core";
import {
  Controller,
  HttpException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import {
  CoreBoundaryDomainError,
  CoreBoundaryGoneError,
  CoreBoundaryNotFoundError,
  CoreBoundaryOtherError,
} from "../internal/CoreBoundaryDomainErrors";

/**
 * Owns the original interleaved exception registrations for one application.
 *
 * @evidence contracts/common.md#principled-implementation Domain, unrelated, subclass and deepest subclass registrations preserve the original insertion order and four literal converters.
 * @evidence contracts/common.md#clear-and-simple-design Nest initialization registers owned constructors; destruction erases only those identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Peers and the default HttpError converter remain registered; no registry reset or name special case occurs.
 * @evidence contracts/common.md#meaningful-documentation The lifecycle bounds state across sequential Express and Fastify applications.
 * @evidence contracts/performance.md#efficient-algorithms Four registrations and four erasures delegate linear identity/prototype searches to ExceptionManager; cost is O(R) for registry size R with a fixed owned population of four.
 * @evidence contracts/performance.md#reuse-equivalent-work All requests in one application reuse these four initialized conversions. The next adapter application registers them again after exact-identity destruction, rather than trusting prior mutable registry state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This controller acquires four converter entries during initialization and releases those same constructors during Nest destruction; unrelated registry state is retained by its own owner. The shared backend finally owns close after startup or request failure.
 */
@Controller("core_boundary/manager")
export class CoreBoundaryExceptionManagerController
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Registers the four original conversions before requests.
   *
   * @evidence contracts/common.md#principled-implementation The authored order Domain, Other, NotFound, Gone exposes ancestor-first mistakes.
   * @evidence contracts/common.md#clear-and-simple-design Four public insert calls map exact constructors to their independent literal status/message.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration uses supported ExceptionManager APIs and changes no unrelated entry.
   * @evidence contracts/common.md#meaningful-documentation The method records initialization order and response literals.
   * @evidence contracts/performance.md#efficient-algorithms Four public insert operations each scan registry identity and ancestry once; the fixed four-entry addition costs O(R) time and constant owned storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Initialization runs once per acquired Nest application, allowing every request to reuse the same converters until destruction. Different adapter sessions repeat registration because their lifecycle state is distinct.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the four authored constructor/closure pairs are retained. Nest destruction erases those identities, including when the shared backend closes an acquired application after later startup failure.
   */
  public onModuleInit(): void {
    core.ExceptionManager.insert(
      CoreBoundaryDomainError,
      () => new HttpException("domain", 400),
    );
    core.ExceptionManager.insert(
      CoreBoundaryOtherError,
      () => new HttpException("other", 409),
    );
    core.ExceptionManager.insert(
      CoreBoundaryNotFoundError,
      () => new HttpException("not found", 404),
    );
    core.ExceptionManager.insert(
      CoreBoundaryGoneError,
      () => new HttpException("gone", 410),
    );
  }
  /**
   * Releases only this controller's constructor registrations.
   *
   * @evidence contracts/common.md#principled-implementation Exact constructor identity bounds state to this app and leaves unrelated entries intact.
   * @evidence contracts/common.md#clear-and-simple-design Four public erase calls mirror the owned registrations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No tuple mutation, wholesale reset or default converter removal occurs.
   * @evidence contracts/common.md#meaningful-documentation Destruction makes sequential backend reuse valid.
   * @evidence contracts/performance.md#efficient-algorithms Four public erase calls perform exact-identity searches over the current registry, costing O(R) time without constructing a copied registry.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Destruction invalidates the owned registrations and produces no reusable computation; it must run for each acquired application lifecycle.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each owned constructor is erased independently, leaving peers and the default converter intact. No per-request converter population or historical application entries accumulate after successful destruction.
   */
  public onModuleDestroy(): void {
    core.ExceptionManager.erase(CoreBoundaryDomainError);
    core.ExceptionManager.erase(CoreBoundaryOtherError);
    core.ExceptionManager.erase(CoreBoundaryNotFoundError);
    core.ExceptionManager.erase(CoreBoundaryGoneError);
  }
  @core.TypedRoute.Get("domain")
  /**
   * Throws the authored domain error.
   *
   * @evidence contracts/common.md#principled-implementation The registered constructor's literal converter supplies HTTP status and message.
   * @evidence contracts/common.md#clear-and-simple-design One stateless throw connects route_error to the registry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The error is a real instance; no response or validator is mocked.
   * @evidence contracts/common.md#meaningful-documentation The method names its intentional domain failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This handler constructs and throws one request-local Error and chooses no population-dependent algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request needs its own thrown error; this handler coordinates no shared or cached computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary error transfers to the route error pipeline; this stateless handler retains no converter, resource or task across requests.
   */
  public domain(): void {
    throw new CoreBoundaryDomainError();
  }
  @core.TypedRoute.Get("other")
  /**
   * Throws the authored other error.
   *
   * @evidence contracts/common.md#principled-implementation The registered constructor's literal converter supplies HTTP status and message.
   * @evidence contracts/common.md#clear-and-simple-design One stateless throw connects route_error to the registry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The error is a real instance; no response or validator is mocked.
   * @evidence contracts/common.md#meaningful-documentation The method names its intentional domain failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This handler constructs and throws one request-local Error and chooses no population-dependent algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request needs its own thrown error; this handler coordinates no shared or cached computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary error transfers to the route error pipeline; this stateless handler retains no converter, resource or task across requests.
   */
  public other(): void {
    throw new CoreBoundaryOtherError();
  }
  @core.TypedRoute.Get("notFound")
  /**
   * Throws the authored notFound error.
   *
   * @evidence contracts/common.md#principled-implementation The registered constructor's literal converter supplies HTTP status and message.
   * @evidence contracts/common.md#clear-and-simple-design One stateless throw connects route_error to the registry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The error is a real instance; no response or validator is mocked.
   * @evidence contracts/common.md#meaningful-documentation The method names its intentional domain failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This handler constructs and throws one request-local Error and chooses no population-dependent algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request needs its own thrown error; this handler coordinates no shared or cached computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary error transfers to the route error pipeline; this stateless handler retains no converter, resource or task across requests.
   */
  public notFound(): void {
    throw new CoreBoundaryNotFoundError();
  }
  @core.TypedRoute.Get("gone")
  /**
   * Throws the authored gone error.
   *
   * @evidence contracts/common.md#principled-implementation The registered constructor's literal converter supplies HTTP status and message.
   * @evidence contracts/common.md#clear-and-simple-design One stateless throw connects route_error to the registry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The error is a real instance; no response or validator is mocked.
   * @evidence contracts/common.md#meaningful-documentation The method names its intentional domain failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This handler constructs and throws one request-local Error and chooses no population-dependent algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request needs its own thrown error; this handler coordinates no shared or cached computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary error transfers to the route error pipeline; this stateless handler retains no converter, resource or task across requests.
   */
  public gone(): void {
    throw new CoreBoundaryGoneError();
  }
}
