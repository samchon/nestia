require("@nestjs/common");
const assert = require("node:assert/strict");
const {
  ReflectWebSocketOperationAnalyzer,
} = require("../../../../packages/sdk/lib/analyses/ReflectWebSocketOperationAnalyzer");

/**
 * Verifies WebSocket reflection retains imports needed by header arguments.
 *
 * A tgrid type can be an actual client-facing argument, rather than only the
 * server wrapper. Filtering its declaration by a dependency path drops a
 * necessary import from an otherwise valid generated client.
 *
 * 1. Supply authored acceptor metadata whose header names each wrapper type.
 * 2. Retain those exact imports, plus an adjacent ordinary DTO declaration.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual WebSocket reflection preserves Driver, WebSocketAcceptor and ordinary DTO imports when those types occur in the header argument written by the client.
 * @evidence contracts/testing.md#independent-expectations Authored reflected types actually name each imported binding; their declaration locations cannot make those necessary references disappear.
 * @evidence contracts/testing.md#distinguishing-cases Both dependency wrapper declaration paths contrast with an ordinary DTO path; all three bindings belong to real header argument references, while the native unit owns exclusion of server-only outer wrappers.
 * @evidence contracts/testing.md#execution-ownership The SDK mixed-language unit entry discovers this matching JavaScript export. Authored metadata reaches the caller-built analyzer directly, without files, installation, compilation, hosts or subprocesses.
 */
function test_sdk_websocket_argument_imports() {
  for (const name of ["HeaderDto", "Driver", "WebSocketAcceptor"]) {
    class Controller {
      connect(acceptor) {}
    }
    const target = Controller.prototype.connect;
    Reflect.defineMetadata("nestia/WebSocketRoute", { paths: [""] }, target);
    Reflect.defineMetadata(
      "nestia/WebSocketRoute/Parameters",
      [{ category: "acceptor", index: 0 }],
      Controller.prototype,
      "connect",
    );
    const imported = {
      file: `consumer/node_modules/tgrid/lib/components/${name}.d.ts`,
      elements: [name],
      default: null,
      asterisk: null,
    };
    const project = { errors: [] };
    const operation = ReflectWebSocketOperationAnalyzer.analyze({
      project,
      controller: { class: Controller, file: "fixture.ts", paths: [""] },
      function: target,
      name: "connect",
      metadata: {
        parameters: [
          {
            index: 0,
            name: "acceptor",
            type: {
              name: "WebSocketAcceptor",
              typeArguments: [
                { name },
                { name: "Provider" },
                { name: "Listener" },
              ],
            },
            imports: [imported],
            description: null,
            jsDocTags: [],
          },
        ],
        description: null,
        jsDocTags: [],
      },
    });
    assert.deepEqual(project.errors, []);
    assert.ok(operation);
    assert.deepEqual(operation.imports, [imported]);
  }
}

module.exports = { test_sdk_websocket_argument_imports };
