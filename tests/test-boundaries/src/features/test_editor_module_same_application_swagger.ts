import http from "http";
import path from "path";

/**
 * Verifies `NestiaEditorModule.setup()` serves the application's own Swagger
 * document named by a path, as the editor guide sets it up.
 *
 * `setup()` fetched a string `swagger` while it ran, before `listen()`: Node's
 * `fetch` rejects a relative URL such as `@nestjs/swagger`'s "/api-json", and
 * the application would not have served it yet anyway, so the documented setup
 * threw at bootstrap (#1687).
 *
 * 1. Set the editor up with "/api-json" on an application not listening yet, which
 *    must neither fetch nor ask for its address.
 * 2. Start serving "/api-json", then request the editor's document.
 * 3. Assert it is the application's document, and that a failing location answers
 *    an error instead of crashing.
 *
 * @evidence contracts/testing.md#behavioral-verification It sets `NestiaEditorModule` up with a path on an application that is not listening and asserts no fetch and no address request happen at setup, then serves the path and asserts the editor's document is the application's own.
 * @evidence contracts/testing.md#independent-expectations The expected document is the one the test's own route serves, and a failing location must answer an error status, both fixed by the guide's setup contract.
 * @evidence contracts/testing.md#distinguishing-cases Setup before listening, the served document after listening, and a failing location are the separate cases.
 * @evidence contracts/testing.md#execution-ownership E2E: DynamicExecutor discovers this case in test-boundaries; the built editor resolves a relative Swagger location by performing actual HTTP fetches against a temporary Node server.
 * @evidence contracts/e2e.md#necessary-boundary The real fetch connection distinguishes deferred resolution before listening, successful response delivery and a failing HTTP location. Direct handler return values cannot establish URL resolution or fetch status handling.
 * @evidence contracts/e2e.md#shared-execution One installed editor build and one HTTP server serve both successful and failed requests; bootstrap before listen is part of the same scenario, with no separate browser or NestJS process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The application adapter and route handlers belong to this invocation, the HTTP server listens on an assigned free port and finally closes after all fetches; other boundary tests execute sequentially.
 * @evidence contracts/e2e.md#preserved-coverage Bootstrap timing, same-application Swagger contents and failed-location status remain in this boundary case; archive, composer and markup operations remain in test-unit.
 */
export const test_editor_module_same_application_swagger =
  async (): Promise<void> => {
    const { NestiaEditorModule } = require(
      path.resolve(
        process.cwd(),
        "../../packages/editor/lib/NestiaEditorModule.js",
      ),
    );
    const handlers: Map<string, Function> = new Map();
    let address: string | null = null;
    const application = {
      use() {
        return this;
      },
      setGlobalPrefix() {
        return this;
      },
      getUrl: async (): Promise<string> => {
        if (address === null)
          throw new Error("the application is not listening yet");
        return address;
      },
      getHttpAdapter: () => ({
        getType: () => "express",
        close: () => {},
        get: (route: string, handler: Function) => handlers.set(route, handler),
        post: () => {},
        put: () => {},
        patch: () => {},
        delete: () => {},
        head: () => {},
        all: () => {},
      }),
    };
    await NestiaEditorModule.setup({
      path: "editor",
      application,
      swagger: "/api-json",
    });
    const handler: Function | undefined = handlers.get("/editor/swagger.json");
    if (handler === undefined)
      throw new Error("The editor does not serve its Swagger document.");

    const server: http.Server = http.createServer((request, response) => {
      if (request.url === "/api-json") {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify(DOCUMENT));
      } else {
        response.statusCode = 404;
        response.end();
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    try {
      address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      const served = await reply(handler);
      if (
        served.status !== 200 ||
        JSON.stringify(JSON.parse(served.body)) !== JSON.stringify(DOCUMENT)
      )
        throw new Error(
          `The editor served ${served.status} ${served.body} for "/api-json".`,
        );

      // a location that fails answers an error, and is tried again later
      handlers.clear();
      await NestiaEditorModule.setup({
        path: "missing",
        application,
        swagger: "/missing-json",
      });
      const failed = await reply(handlers.get("/missing/swagger.json")!);
      if (failed.status === 200)
        throw new Error("A missing document was served as a success.");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };

const reply = async (
  handler: Function,
): Promise<{ status: number; body: string }> => {
  const output = { status: 200, body: "" };
  const response = {
    status: (code: number) => {
      output.status = code;
      return response;
    },
    type: () => response,
    send: (body: string) => {
      output.body = body;
      return response;
    },
    redirect: () => response,
  };
  await handler({}, response);
  return output;
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Same application", version: "1.0.0" },
  paths: {},
  components: {},
};
