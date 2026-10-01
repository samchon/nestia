import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IncomingMessage } from "node:http";

import { installBenchmarkMonitor } from "./benchmark/BenchmarkMonitor";

/**
 * Owns the common application's HTTP, WebSocket and MCP transports.
 *
 * Controller scenarios have distinct route prefixes and DTO names, so their
 * requests share a server without sharing mutable request state.
 *
 * 1. Load all authored controller scenarios into one encrypted module.
 * 2. Register the parser and transport adaptors before one ephemeral listen.
 * 3. Close that same application after every consumer has settled.
 *
 * @evidence contracts/common.md#principled-implementation One Nest application loads the emitted scenario controllers, authored migration inputs and benchmark controller through EncryptedModule, then attaches the supported WebSocket and MCP adaptors. Route and DTO namespaces preserve dispatch identity within that application.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns only application acquisition and closure; generation and request discovery remain in the entry and consumer. Its optional application field distinguishes not-yet-acquired from acquired resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public Nest and nestia composition APIs configure the actual server. Middleware observes benchmark responses and scopes the Express parser to its explicit preconsumed-stream fixture route rather than replacing foreign methods.
 * @evidence contracts/common.md#meaningful-documentation The comment describes shared transports, input namespaces and the lifetime ending after consumer settlement. Open and close document failure cleanup and the one-session constraint.
 * @evidence contracts/performance.md#efficient-algorithms Controller discovery traverses the combined emitted input once and Nest creates one container; work grows with the controller population, with no per-case application creation.
 * @evidence contracts/performance.md#reuse-equivalent-work All scenario cases share this same immutable emitted program and stateless handlers. The explicit parser route prefix preserves preconsumed and raw-stream premises in one host; benchmark counters reset between the ordinary requests and its workload.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper retains at most one application, assigned before adaptor/listen operations so the entry's finally can close it on startup failure. The entry awaits all clients/workers before calling close and removes outputs only afterward.
 * @evidence contracts/portability.md#os-neutral-implementation Emitted paths use Node's native __dirname and the public controller loader. An ephemeral loopback TCP port prevents fixed-port collisions; HTTP route prefixes remain protocol strings rather than filesystem paths.
 */
export class Backend {
  public application?: INestApplication;

  /**
   * Opens the one shared application and records ownership before listening.
   *
   * A startup rejection leaves the acquired application available to close.
   * Only the preconsumed-stream scenario receives Express's text parser.
   *
   * @evidence contracts/common.md#principled-implementation EncryptedModule supplies the common password and native controller classes; supported adaptor upgrades and parser configuration happen before listening. The text parser's explicit route predicate preserves raw-body controls on other routes.
   * @evidence contracts/common.md#clear-and-simple-design Acquisition, parser registration, transport upgrade and listen occur in their required order. A duplicate open rejects rather than replacing the owned application.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Configuration uses public APIs and an Express parser predicate; no loader, cache, child process method or framework global is replaced.
   * @evidence contracts/common.md#meaningful-documentation The comment states single-session ownership, startup-failure cleanup and scoped parser behavior.
   * @evidence contracts/performance.md#efficient-algorithms One controller discovery and container construction serve the complete case population; no request repeats this preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work The emitted controller inputs remain unchanged throughout the shared session. Routes isolate specimens; the monitor separately resets workload counters before benchmarking.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One application is retained immediately after acquisition, including when an upgrade or listen rejects; the caller's finally owns its subsequent closure.
   * @evidence contracts/portability.md#os-neutral-implementation Native emitted directory paths are passed to the loader and Nest listens on loopback with port zero; clients obtain the actual selected TCP address from the server.
   */
  public async open(): Promise<INestApplication> {
    if (this.application !== undefined)
      throw new Error("The common application is already acquired.");
    const application = await NestFactory.create<NestExpressApplication>(
      await core.EncryptedModule.dynamic(
        [
          __dirname + "/scenarios",
          __dirname + "/benchmark",
          __dirname + "/migration/source",
        ],
        {
          key: "A".repeat(32),
          iv: "B".repeat(16),
        },
      ),
      { logger: false },
    );
    this.application = application;
    installBenchmarkMonitor(application);
    application.useBodyParser("text", {
      type: (request: IncomingMessage) =>
        request.url?.startsWith("/plain_text_parser/") === true,
    });
    await core.WebSocketAdaptor.upgrade(application);
    await core.McpAdaptor.upgrade(application, { path: "/mcp" });
    await application.listen(0, "127.0.0.1");
    return application;
  }

  /**
   * Closes the acquired application after consumers and workers have settled.
   *
   * @evidence contracts/common.md#principled-implementation Nest's public close operation ends the HTTP server and registered transport lifetimes; the ownership field is cleared only after closure succeeds.
   * @evidence contracts/common.md#clear-and-simple-design An unacquired helper needs no cleanup; an acquired helper awaits the framework's closure before becoming empty.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The framework owns server/adaptor shutdown; the helper does not force-delete resources or modify a foreign lifecycle method.
   * @evidence contracts/common.md#meaningful-documentation The comment states that consumer and worker settlement precedes application closure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This delegates one application shutdown and chooses no population-dependent computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Closure ends this instance's session; it computes no reusable result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful closure releases the single retained application; rejection remains observable with the field retained rather than falsely claiming release.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The public Nest close method owns its transport shutdown; this method introduces no native path or executable representation.
   */
  public async close(): Promise<void> {
    if (this.application === undefined) return;
    await this.application.close();
    this.application = undefined;
  }
}
