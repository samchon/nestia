import http from "http";
import path from "path";

const EDITOR_LIB = path.resolve(process.cwd(), "../../packages/editor/lib");

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
 * @evidence contracts/testing.md#behavioral-verification NestiaEditorModule setup defers a relative Swagger fetch until its application is listening.
 * @evidence contracts/testing.md#independent-expectations The local HTTP server serves an authored literal OpenAPI document and independently returns 404 for missing locations.
 * @evidence contracts/testing.md#distinguishing-cases Setup before listen must succeed, served Swagger must match the literal document and missing Swagger must answer a failure status.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this real CLI or HTTP boundary by its test-prefixed export.
 * @evidence contracts/e2e.md#necessary-boundary A relative Swagger location must connect deferred editor setup to the listening application over real HTTP; direct URL calculations cannot prove the fetch boundary.
 * @evidence contracts/e2e.md#shared-execution One local HTTP server supplies both successful and missing-document requests after setup; no server or package installation is repeated per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The server binds an ephemeral loopback port and closes in finally; handler maps are cleared between the success and missing-document registrations.
 * @evidence contracts/e2e.md#preserved-coverage The relocated case retains setup-before-listen, exact authored document serving and missing-document failure assertions; other editor archive and composition assertions remain in their original units.
 */

export const test_editor_module_same_application_swagger =
  async (): Promise<void> => {
    const { NestiaEditorModule } = require(
      path.join(EDITOR_LIB, "NestiaEditorModule.js"),
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
