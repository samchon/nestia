import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  ExpressAdapter,
  NestExpressApplication,
} from "@nestjs/platform-express";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { IncomingMessage } from "node:http";

import { installBenchmarkMonitor } from "./benchmark/BenchmarkMonitor";
import { Global as SimulationOriginalGlobal } from "./scenarios/simulation_original/Global";

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
 * @evidence contracts/performance.md#reuse-equivalent-work Sequential Express and Fastify applications share the same immutable emitted controller program and stateless handlers; their conflicting adapter configuration requires two actual application lifetimes. The explicit Express parser route prefix preserves preconsumed and raw-stream premises; Fastify installs the public multipart stream-preserving and urlencoded parsers required by its adapter; benchmark counters reset between the ordinary requests and its workload.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper retains at most one application, assigned before adaptor/listen operations so the entry's finally can close it on startup failure. The entry awaits all clients/workers before calling close and removes outputs only afterward.
 * @evidence contracts/portability.md#os-neutral-implementation Emitted paths use Node's native __dirname and the public controller loader. An ephemeral loopback TCP port prevents fixed-port collisions; HTTP route prefixes remain protocol strings rather than filesystem paths.
 */
export class Backend {
  public application?: INestApplication;
  private requestCount = 0;
  private readonly observeRequest = (): void => {
    ++this.requestCount;
  };

  /**
   * Opens the one shared application and records ownership before listening.
   *
   * A startup rejection leaves the acquired application available to close.
   * Only the preconsumed-stream scenario receives Express's text parser.
   * Fastify uses its text parser and explicit multipart/urlencoded parser
   * configuration.
   *
   * @evidence contracts/common.md#principled-implementation EncryptedModule supplies the common password and native controller classes; supported adaptor upgrades and parser configuration happen before listening. Express scopes the text parser to preserve raw-body controls on other routes. Fastify preserves the multipart stream for fastify-multer and decodes urlencoded bodies to URLSearchParams, retaining repeated fields.
   * @evidence contracts/common.md#clear-and-simple-design Acquisition, parser registration, transport upgrade and listen occur in their required order. A duplicate open rejects rather than replacing the owned application.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Configuration uses public Nest adapter APIs, Fastify content-type parsers and an Express parser predicate; no loader, cache, child process method or framework global is replaced.
   * @evidence contracts/common.md#meaningful-documentation The comment states single-session ownership, startup-failure cleanup and scoped parser behavior.
   * @evidence contracts/performance.md#efficient-algorithms One controller discovery and container construction serve the complete case population; no request repeats this preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work The emitted controller inputs remain unchanged throughout the shared session. Routes isolate specimens; the monitor separately resets workload counters before benchmarking.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One application is retained immediately after acquisition, including when an upgrade or listen rejects; the caller's finally owns its subsequent closure.
   * @evidence contracts/portability.md#os-neutral-implementation Native emitted directory paths are passed to the loader and Nest listens on loopback with port zero; clients obtain the actual selected TCP address from the server.
   */
  public async open(
    adapter: "express" | "fastify" = "express",
  ): Promise<INestApplication> {
    if (this.application !== undefined)
      throw new Error("The common application is already acquired.");
    const application = await NestFactory.create<INestApplication>(
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
      adapter === "express" ? new ExpressAdapter() : new FastifyAdapter(),
      { logger: false },
    );
    this.application = application;
    this.requestCount = 0;
    SimulationOriginalGlobal.used = false;
    application.getHttpServer().on("request", this.observeRequest);
    installBenchmarkMonitor(application);
    if (adapter === "express") {
      (application as NestExpressApplication).useBodyParser("text", {
        type: (request: IncomingMessage) =>
          request.url?.startsWith("/plain_text_parser/") === true,
      });
    } else {
      const instance = (application as NestFastifyApplication)
        .getHttpAdapter()
        .getInstance();
      instance.addContentTypeParser(
        "multipart/form-data",
        (_request, _payload, done) => done(null),
      );
      instance.addContentTypeParser(
        "application/x-www-form-urlencoded",
        { parseAs: "string" },
        (_request, body: string, done) => done(null, new URLSearchParams(body)),
      );
    }
    await core.WebSocketAdaptor.upgrade(application);
    await core.McpAdaptor.upgrade(application, { path: "/mcp" });
    await application.listen(0, "127.0.0.1");
    return application;
  }

  /**
   * Supplies live observations from this acquired producer application.
   *
   * The consumer receives callbacks, not a second copy of producer state.
   *
   * @evidence contracts/common.md#principled-implementation Callbacks read the native server request count and the actual imported producer Global bit; resetting the bit establishes the simulation interval after a real positive proves both observers active.
   * @evidence contracts/common.md#clear-and-simple-design A structural context exposes only observations and the owned fixture bit reset, without importing consumer source or acquiring another application.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The native request event is passive; no framework method, fetch implementation, generated request or server response is replaced.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes live producer state from copied consumer DTO oracles.
   * @evidence contracts/performance.md#efficient-algorithms Each request increments one integer and each observation reads constant state.
   * @evidence contracts/performance.md#reuse-equivalent-work Both adapter consumers use callbacks for their currently acquired application; opening the next adapter resets this application's observation interval.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One listener is attached before listen and removed after successful application close; a close failure retains observable ownership for the entry's cleanup.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The callbacks introduce no filesystem path or platform-specific protocol representation.
   */
  public richContext() {
    if (this.application === undefined)
      throw new Error("No acquired backend context.");
    return {
      httpRequests: () => this.requestCount,
      simulationOriginal: {
        used: () => SimulationOriginalGlobal.used,
        reset: () => {
          SimulationOriginalGlobal.used = false;
        },
      },
    };
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
    const server = this.application.getHttpServer();
    await this.application.close();
    server.off("request", this.observeRequest);
    this.application = undefined;
  }
}
