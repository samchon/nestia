import { TestValidator } from "@nestia/e2e";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import path from "path";

/**
 * Verifies `EncryptedBody` reports a password the cipher refuses as a server
 * error and every bad body as one indistinguishable 400.
 *
 * A key of an unsupported length or a short initialization vector is the
 * server's configuration, yet it surfaced as "Failed to decrypt the request
 * body", blaming every client. Body failures must stay a single response so the
 * decorator opens no padding oracle.
 *
 * 1. Apply the decorator to a controller with a password the cipher refuses and
 *    read the parameter factory Nest would call.
 * 2. Call it with a request body and assert the error is not a 400 and keeps the
 *    cipher's error code.
 * 3. With a valid password, send a corrupt body and a valid cipher text that is
 *    not JSON, and assert both give the same 400, and a valid body is
 *    returned.
 *
 * @evidence contracts/testing.md#behavioral-verification The factory built by the real decorator is called with a request carrying a body, so the thrown value's class and code are the ones Nest would map to a status, and the two body failures are compared for identity.
 * @evidence contracts/testing.md#independent-expectations The refused passwords are a 10-byte key, a short vector and non-string fields, which Node rejects by its argument/cipher error codes. The ciphertexts use a valid handwritten key and vector.
 * @evidence contracts/testing.md#distinguishing-cases Unknown-cipher key, invalid vector length and invalid key/vector types are server-error cases. Corrupt ciphertext and non-JSON plaintext must stay identical client errors, and a valid body is the positive control.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-core process against the built core decorator loaded by absolute path, with a plain request object; no Nest application, server or network starts.
 */
export async function test_core_encrypted_body_password_misconfiguration(): Promise<void> {
  const root: string = path.resolve(
    process.cwd(),
    "..",
    "..",
    "packages",
    "core",
    "lib",
  );
  const { EncryptedBody } = require(
    path.join(root, "decorators", "EncryptedBody.js"),
  ) as { EncryptedBody: () => ParameterDecorator };
  const { doNotThrowTransformError } = require(
    path.join(root, "decorators", "doNotThrowTransformError.js"),
  ) as { doNotThrowTransformError: (value?: boolean) => void };
  const { BadRequestException } = require(
    require.resolve("@nestjs/common", { paths: [root] }),
  ) as {
    BadRequestException: new (...args: any[]) => Error;
  };
  const { ENCRYPTION_CONTROLLER_METADATA_KEY } = require(
    path.join(root, "decorators", "internal", "EncryptedConstant.js"),
  ) as { ENCRYPTION_CONTROLLER_METADATA_KEY: string };
  require(require.resolve("reflect-metadata", { paths: [root] }));
  const metadata: any = Reflect;

  const call = async (
    password: { key: unknown; iv: unknown },
    body: string,
  ): Promise<unknown> => {
    class Controller {
      public method(_body: unknown): void {}
    }
    EncryptedBody()(Controller.prototype, "method", 0);
    metadata.defineMetadata(
      ENCRYPTION_CONTROLLER_METADATA_KEY,
      password,
      Controller,
    );
    const args: Record<string, { factory: Function }> = metadata.getMetadata(
      "__routeArguments__",
      Controller,
      "method",
    );
    const factory: Function = Object.values(args)[0]!.factory;
    const request = { headers: { "content-type": "text/plain" }, body };
    try {
      return await factory(undefined, {
        getClass: () => Controller,
        switchToHttp: () => ({ getRequest: () => request }),
      });
    } catch (error) {
      return error;
    }
  };

  doNotThrowTransformError(false);
  try {
    const key: string = "A".repeat(32);
    const iv: string = "B".repeat(16);
    for (const [title, password, code] of [
      [
        "unknown cipher",
        { key: "short-key!", iv },
        "ERR_CRYPTO_UNKNOWN_CIPHER",
      ],
      ["invalid vector", { key, iv: "short" }, "ERR_CRYPTO_INVALID_IV"],
      ["invalid key type", { key: undefined, iv }, "ERR_INVALID_ARG_TYPE"],
      ["invalid vector type", { key, iv: 123 }, "ERR_INVALID_ARG_TYPE"],
    ] as const) {
      const error: any = await call(password, AesPkcs5.encrypt("{}", key, iv));
      TestValidator.predicate(
        `${title} is not a client error`,
        error instanceof Error &&
          error instanceof BadRequestException === false &&
          (error as any).code === code,
      );
    }

    const corrupt: any = await call({ key, iv }, "not-a-cipher-text");
    const notJson: any = await call(
      { key, iv },
      AesPkcs5.encrypt("not json", key, iv),
    );
    for (const [title, error] of [
      ["corrupt", corrupt],
      ["not json", notJson],
    ] as const)
      TestValidator.predicate(
        `${title} is a bad request`,
        error instanceof BadRequestException,
      );
    TestValidator.equals(
      "the two failures are indistinguishable",
      [corrupt.getStatus(), corrupt.getResponse()],
      [notJson.getStatus(), notJson.getResponse()],
    );
    TestValidator.equals(
      "a valid body is decoded",
      await call(
        { key, iv },
        AesPkcs5.encrypt(JSON.stringify({ a: 1 }), key, iv),
      ),
      { a: 1 },
    );
  } finally {
    doNotThrowTransformError(true);
  }
}
