import { TestValidator } from "@nestia/e2e";
import path from "path";

/**
 * Verifies concurrent first document requests share location resolution and a
 * failed producer can be retried by a later request.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual setup registers a Swagger handler on a recording adapter. Two concurrent invocations must call the pending location resolver once, both return 502 after its rejection, and a subsequent invocation must call it again rather than retain the failed promise.
 * @evidence contracts/testing.md#independent-expectations The route registration fixes one document location; two consumers of its pending resolution are equivalent. The authored deferred rejection controls when failure occurs independently of the loader.
 * @evidence contracts/testing.md#distinguishing-cases Concurrent unresolved requests distinguish in-flight sharing, both response bodies/statuses distinguish error propagation, and a later rejected request distinguishes failure eviction from permanently caching a failed promise. Successful document serving remains covered by the editor location cases.
 * @evidence contracts/testing.md#execution-ownership Unit: the test-editor runner discovers this exported callback, using inert adapter and response objects plus a caller-owned deferred getUrl promise. No fetch, HTTP server, consumer installation or native compilation executes.
 */
export const test_editor_module_pending_document = async (): Promise<void> => {
  const { NestiaEditorModule } = require(
    path.resolve(
      process.cwd(),
      "../../packages/editor/lib/NestiaEditorModule.js",
    ),
  ) as { NestiaEditorModule: { setup: (props: object) => Promise<void> } };
  let handler: (req: unknown, res: object) => Promise<void>;
  let calls = 0;
  let reject!: (error: Error) => void;
  const first = new Promise<string>((_resolve, failure) => {
    reject = failure;
  });
  await NestiaEditorModule.setup({
    path: "editor",
    swagger: "/document.json",
    application: {
      use() {
        return this;
      },
      setGlobalPrefix() {
        return this;
      },
      getUrl: async () => {
        ++calls;
        return calls === 1 ? first : Promise.reject(new Error("retry failure"));
      },
      getHttpAdapter: () => ({
        getType: () => "recording",
        close: () => undefined,
        get: (route: string, callback: typeof handler) => {
          if (route.endsWith("/swagger.json")) handler = callback;
        },
        post: () => undefined,
        put: () => undefined,
        patch: () => undefined,
        delete: () => undefined,
        head: () => undefined,
        all: () => undefined,
      }),
    },
  });
  const responses: Array<{ status: number; body: string }> = [];
  const response = () => {
    const observed = { status: 0, body: "" };
    responses.push(observed);
    return {
      status: (code: number) => {
        observed.status = code;
      },
      type: () => undefined,
      send: (body: string) => {
        observed.body = body;
      },
    };
  };
  const one = handler!({}, response());
  const two = handler!({}, response());
  await Promise.resolve();
  const pendingCalls = calls;
  reject(new Error("first failure"));
  await Promise.all([one, two]);
  TestValidator.equals("one pending location producer", pendingCalls, 1);
  TestValidator.equals("shared failure responses", responses, [
    { status: 502, body: "first failure" },
    { status: 502, body: "first failure" },
  ]);
  await handler!({}, response());
  TestValidator.equals("failed producer retries", calls, 2);
  TestValidator.equals("retry failure response", responses[2], {
    status: 502,
    body: "retry failure",
  });
};
