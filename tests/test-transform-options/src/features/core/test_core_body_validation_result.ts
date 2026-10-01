import assert from "node:assert/strict";
import { createCipheriv } from "node:crypto";
import path from "node:path";

/**
 * Verifies successful body validator values survive the error-only protocol.
 *
 * Clone callbacks return a different object and validation data may
 * legitimately be Error, null or undefined. Using those values as failure
 * sentinels or always returning the original request loses the supported
 * callback result.
 *
 * 1. Resolve assert/is/validate, clone/prune and legacy callbacks directly.
 * 2. Distinguish valid boundary values from translated validation failures.
 * 3. Invoke actual Nest parameter factories with authored requests and recover
 *    after failures, restoring the missing-transform guard in finally.
 *
 * @evidence contracts/testing.md#behavioral-verification The owning resolver retains callback data and legacy error-only behavior. Actual TypedBody, EncryptedBody and PlainBody factories bind successful replacements; actual WebSocket/MCP registration retains resolvers in metadata. Media errors and absent-body handling remain distinct; real adaptor transport forwarding is owned by the shared core_boundary E2E case.
 * @evidence contracts/testing.md#independent-expectations Authored callbacks return separately retained object identities and literal success/error reports. Public assert and validation descriptors promise their returned data; legacy null success has no replacement value and therefore preserves input.
 * @evidence contracts/testing.md#distinguishing-cases Assert clone, is identity, validate clone, in-place prune, valid Error/null/undefined, legacy success/failure, invalid descriptors, detailed assertion/validation failures, non-guard throws, absent input, wrong media and subsequent recovery distinguish the protocols without a sentinel ambiguity.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this single pure unit export in test-transform-options. It loads caller-built core operations and Nest metadata factories by resolved package path; no package build, consumer installation, application, backend or compiler host starts here.
 */
export async function test_core_body_validation_result(): Promise<void> {
  const root = path.dirname(require.resolve("@nestia/core/package.json"));
  const load = (relative: string): any =>
    require(path.join(root, "lib", relative));
  const { validate_request_body: build, resolve_request_body: resolve } = load(
    "decorators/internal/validate_request_body.js",
  );
  const { TypedBody } = load("decorators/TypedBody.js");
  const { PlainBody } = load("decorators/PlainBody.js");
  const { EncryptedBody } = load("decorators/EncryptedBody.js");
  const { ENCRYPTION_CONTROLLER_METADATA_KEY } = load(
    "decorators/internal/EncryptedConstant.js",
  );
  const { WebSocketRoute } = load("decorators/WebSocketRoute.js");
  const { McpRoute } = load("decorators/McpRoute.js");
  const { doNotThrowTransformError } = load(
    "decorators/doNotThrowTransformError.js",
  );
  const { BadRequestException } = require(
    require.resolve("@nestjs/common", { paths: [root] }),
  );
  const { ROUTE_ARGS_METADATA } = require(
    require.resolve("@nestjs/common/constants", { paths: [root] }),
  );
  const { TypeGuardError } = require(
    require.resolve("typia", { paths: [root] }),
  );
  require(require.resolve("reflect-metadata", { paths: [root] }));
  const metadata = Reflect as any;
  const input = { title: "title", count: 1, extra: "x" };
  const clone = { title: "title", count: 1 };
  let calls = 0;
  const assertion = build("unit")({
    type: "assert",
    assert: () => {
      calls++;
      return clone;
    },
  });
  assert.equal(resolve(assertion, input).data, clone);
  assert.equal(calls, 1);
  assert.equal(assertion(input), null);
  assert.equal(calls, 2);
  assert.equal(input.extra, "x");
  assert.equal(
    resolve(build("unit")({ type: "is", is: () => true }), input).data,
    input,
  );
  assert.equal(
    resolve(
      build("unit")({
        type: "validate",
        validate: () => ({ success: true, data: clone }),
      }),
      input,
    ).data,
    clone,
  );
  const pruned = { title: "title", extra: "x" } as {
    title: string;
    extra?: string;
  };
  const prune = build("unit")({
    type: "assert",
    assert: (value: typeof pruned) => {
      delete value.extra;
      return value;
    },
  });
  assert.equal(resolve(prune, pruned).data, pruned);
  assert.equal(Object.hasOwn(pruned, "extra"), false);
  for (const data of [undefined, null, new Error("valid data")]) {
    for (const validator of [
      { type: "assert", assert: () => data },
      { type: "validate", validate: () => ({ success: true, data }) },
    ]) {
      const checker = build("unit")(validator);
      const result = resolve(checker, input);
      assert.equal(result.success, true);
      assert.equal(result.data, data);
      assert.equal(checker(input), null);
    }
  }
  let legacyCalls = 0;
  assert.equal(
    resolve(() => {
      legacyCalls++;
      return null;
    }, input).data,
    input,
  );
  assert.equal(legacyCalls, 1);
  const failure = new Error("legacy failure");
  assert.deepEqual(
    resolve(() => failure, input),
    { success: false, error: failure },
  );
  const guard = new TypeGuardError({
    method: "unit",
    path: "$input.count",
    expected: "number",
    value: "wrong",
  });
  const checked = build("unit")({
    type: "assert",
    assert: () => {
      throw guard;
    },
  });
  const rejected = resolve(checked, input);
  assert.equal(rejected.success, false);
  assert.ok(rejected.error instanceof BadRequestException);
  assert.deepEqual(rejected.error.getResponse(), {
    path: guard.path,
    reason: guard.message,
    expected: "number",
    value: "wrong",
    message: "Request body data is not following the promised type.",
  });
  const errors = [{ path: "$input.count", expected: "number", value: "wrong" }];
  const report = resolve(
    build("unit")({
      type: "validate",
      validate: () => ({ success: false, errors }),
    }),
    input,
  );
  assert.ok(report.error instanceof BadRequestException);
  assert.deepEqual(report.error.getResponse(), {
    errors,
    message: "Request body data is not following the promised type.",
  });
  assert.ok(
    resolve(build("unit")({ type: "is", is: () => false }), input)
      .error instanceof BadRequestException,
  );
  assert.equal(
    resolve(build("unit")({ type: "invalid" }), input).success,
    false,
  );
  assert.throws(
    () =>
      resolve(
        build("unit")({
          type: "assert",
          assert: () => {
            throw failure;
          },
        }),
        input,
      ),
    (error: unknown) => error === failure,
  );

  const factory = (decorator: ParameterDecorator): Function => {
    class Controller {
      public store(_input: unknown): void {}
    }
    decorator(Controller.prototype, "store", 0);
    return (
      Object.values(
        metadata.getMetadata(ROUTE_ARGS_METADATA, Controller, "store"),
      )[0] as any
    ).factory;
  };
  const context = (body: unknown, contentType?: string): any => ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: contentType ? { "content-type": contentType } : {},
        body,
      }),
    }),
  });
  class MetadataController {
    public store(_input: unknown): void {}
  }
  WebSocketRoute.Header({ type: "assert", assert: () => clone })(
    MetadataController.prototype,
    "store",
    0,
  );
  const socket = metadata.getOwnMetadata(
    "nestia/WebSocketRoute/Parameters",
    MetadataController.prototype,
    "store",
  );
  assert.equal(resolve(socket[0].validate, input).data, clone);
  assert.equal(socket[0].validate(input), null);
  McpRoute.Params({
    type: "validate",
    validate: () => ({ success: true, data: clone }),
  })(MetadataController.prototype, "store", 0);
  const mcp = metadata.getOwnMetadata(
    "nestia/McpRoute/Parameters",
    MetadataController.prototype,
    "store",
  );
  assert.equal(resolve(mcp[0].validate, input).data, clone);
  assert.equal(mcp[0].validate(input), null);
  const bound = factory(TypedBody({ type: "assert", assert: () => clone }));
  assert.equal(bound(undefined, context(input, "application/json")), clone);
  assert.throws(
    () => bound(undefined, context(input, "text/plain")),
    BadRequestException,
  );
  assert.equal(bound(undefined, context(input, "application/json")), clone);
  class EncryptedController {
    public store(_input: unknown): void {}
  }
  EncryptedBody({
    type: "validate",
    validate: () => ({ success: true, data: clone }),
  })(EncryptedController.prototype, "store", 0);
  metadata.defineMetadata(
    ENCRYPTION_CONTROLLER_METADATA_KEY,
    { key: "A".repeat(32), iv: "B".repeat(16) },
    EncryptedController,
  );
  const encrypted = (
    Object.values(
      metadata.getMetadata(ROUTE_ARGS_METADATA, EncryptedController, "store"),
    )[0] as any
  ).factory;
  const cipher = createCipheriv(
    "aes-256-cbc",
    Buffer.from("A".repeat(32)),
    Buffer.from("B".repeat(16)),
  );
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(input), "utf8"),
    cipher.final(),
  ]).toString("base64");
  assert.equal(
    await encrypted(undefined, {
      ...context(ciphertext, "text/plain"),
      getClass: () => EncryptedController,
    }),
    clone,
  );
  for (const data of [undefined, null, new Error("valid bound data")]) {
    const typed = factory(TypedBody({ type: "assert", assert: () => data }));
    assert.equal(typed(undefined, context(input, "application/json")), data);
    class BoundaryController {
      public store(_input: unknown): void {}
    }
    EncryptedBody({
      type: "validate",
      validate: () => ({ success: true, data }),
    })(BoundaryController.prototype, "store", 0);
    metadata.defineMetadata(
      ENCRYPTION_CONTROLLER_METADATA_KEY,
      { key: "A".repeat(32), iv: "B".repeat(16) },
      BoundaryController,
    );
    const encryptedBound = (
      Object.values(
        metadata.getMetadata(ROUTE_ARGS_METADATA, BoundaryController, "store"),
      )[0] as any
    ).factory;
    assert.equal(
      await encryptedBound(undefined, {
        ...context(ciphertext, "text/plain"),
        getClass: () => BoundaryController,
      }),
      data,
    );
  }
  const absent = factory(
    TypedBody({ type: "assert", assert: () => "default" }),
  );
  assert.equal(absent(undefined, context(undefined)), "default");
  const rejecting = factory(TypedBody({ type: "is", is: () => false }));
  assert.throws(
    () => rejecting(undefined, context(undefined)),
    /application\/json/,
  );
  const plain = factory(PlainBody((value: string) => value.toUpperCase()));
  assert.equal(await plain(undefined, context("plain", "text/plain")), "PLAIN");
  await assert.rejects(
    () => plain(undefined, context("plain", "application/json")),
    BadRequestException,
  );
  assert.equal(
    await plain(undefined, context("recovery", "text/plain")),
    "RECOVERY",
  );
  assert.equal(
    await factory(PlainBody())(undefined, context(undefined)),
    undefined,
  );
  assert.throws(() => build("unit")());
  doNotThrowTransformError(false);
  try {
    const unchecked = build("unit")();
    assert.equal(resolve(unchecked, input).data, input);
    assert.equal(unchecked(input), null);
  } finally {
    doNotThrowTransformError(true);
  }
  assert.throws(() => build("unit")());
}
