require("@nestjs/common");
const assert = require("node:assert/strict");
const {
  ReflectWebSocketOperationAnalyzer,
} = require("../../packages/sdk/lib/analyses/ReflectWebSocketOperationAnalyzer");

/**
 * Verifies WebSocket reflection retains the separately decorated header type.
 *
 * The acceptor's generic header and a decorated header parameter need not be
 * the same type. Dropping the decorated parameter silently loses its metadata.
 *
 * 1. Define route metadata with acceptor, header, driver and query parameters.
 * 2. Assert their categories and distinct authored type identities survive.
 * 3. Analyze an acceptor-only route and a function without route metadata.
 */
class Controller {
  connect(acceptor, header, driver, query) {}
  accept(acceptor) {}
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
const analyze = (name, parameters) => {
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
  operation.parameters.map((parameter) => parameter.category),
  ["acceptor", "header", "driver", "query"],
);
assert.equal(operation.parameters[0].type.typeArguments[0], genericHeader);
assert.equal(operation.parameters[1].type, decoratedHeader);
assert.equal(operation.parameters[2].type, driverType);
assert.equal(operation.parameters[3].type, queryType);
assert.deepEqual(
  analyze("accept", [
    { category: "acceptor", type: acceptorType },
  ]).parameters.map((parameter) => parameter.category),
  ["acceptor"],
);
assert.equal(analyze("ordinary", []), null);
