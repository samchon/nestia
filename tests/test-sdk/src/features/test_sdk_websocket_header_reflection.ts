require("@nestjs/common");
const assert = require("node:assert/strict");
const {
  ReflectWebSocketOperationAnalyzer,
} = require("../../../../packages/sdk/lib/analyses/ReflectWebSocketOperationAnalyzer");

/**
 * Verifies WebSocket reflection retains the separately decorated header type.
 *
 * The acceptor's generic header and a decorated header parameter need not be
 * the same type. Dropping the decorated parameter silently loses its metadata.
 *
 * 1. Define route metadata with acceptor, header, driver and query parameters.
 * 2. Assert their categories and distinct authored type identities survive.
 * 3. Analyze an acceptor-only route and a function without route metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual WebSocket reflection retains acceptor, decorated header, driver and query categories and distinct authored type identities, plus the original acceptor-only and undecorated controls.
 * @evidence contracts/testing.md#independent-expectations Authored distinct generic and decorated header identities, parameter categories and literal type names establish independent expectations.
 * @evidence contracts/testing.md#distinguishing-cases Decorated-header versus acceptor-header identity, complete versus acceptor-only metadata and absent route metadata retain all original controls.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching TypeScript file and exported function in the canonical unit process. It calls caller-built product operations with authored input, without installation, native compilation, a host or a child process.
 */
export function test_sdk_websocket_header_reflection(): void {
  class Controller {
    connect(
      _acceptor: unknown,
      _header: unknown,
      _driver: unknown,
      _query: unknown,
    ) {}
    accept(_acceptor: unknown) {}
    ordinary() {}
  }
  const genericHeader = { name: "AcceptorHeader" };
  const decoratedHeader = { name: "DecoratedHeader" };
  const driverType = { name: "Driver", typeArguments: [{ name: "Remote" }] };
  const acceptorType = {
    name: "WebSocketAcceptor",
    typeArguments: [genericHeader, { name: "Provider" }, { name: "Listener" }],
  };
  const queryType = { name: "Query" };
  const analyze = (
    name: keyof Controller,
    parameters: {
      category: string;
      type: { name: string; typeArguments?: { name: string }[] };
    }[],
  ) => {
    const target = Controller.prototype[name];
    if (name !== "ordinary") {
      Reflect.defineMetadata("nestia/WebSocketRoute", { paths: [""] }, target);
      Reflect.defineMetadata(
        "nestia/WebSocketRoute/Parameters",
        parameters.map(({ category }, index) => ({ category, index })),
        Controller.prototype,
        name,
      );
    }
    const project = { errors: [] };
    const result = ReflectWebSocketOperationAnalyzer.analyze({
      project,
      controller: { class: Controller, file: "fixture.ts", paths: [""] },
      function: target,
      name,
      metadata: {
        parameters: parameters.map(({ category, type }, index) => ({
          index,
          name: category,
          type,
          imports: [],
          description: null,
          jsDocTags: [],
        })),
        description: null,
        jsDocTags: [],
      },
    });
    assert.deepEqual(project.errors, []);
    return result;
  };
  const operation = analyze("connect", [
    { category: "acceptor", type: acceptorType },
    { category: "header", type: decoratedHeader },
    { category: "driver", type: driverType },
    { category: "query", type: queryType },
  ]);
  assert.ok(operation);
  assert.deepEqual(
    operation.parameters.map(
      (parameter: { category: string }) => parameter.category,
    ),
    ["acceptor", "header", "driver", "query"],
  );
  assert.equal(operation.parameters[0].type.typeArguments[0], genericHeader);
  assert.equal(operation.parameters[1].type, decoratedHeader);
  assert.equal(operation.parameters[2].type, driverType);
  assert.equal(operation.parameters[3].type, queryType);
  assert.deepEqual(
    analyze("accept", [
      { category: "acceptor", type: acceptorType },
    ]).parameters.map((parameter: { category: string }) => parameter.category),
    ["acceptor"],
  );
  assert.equal(analyze("ordinary", []), null);
}
