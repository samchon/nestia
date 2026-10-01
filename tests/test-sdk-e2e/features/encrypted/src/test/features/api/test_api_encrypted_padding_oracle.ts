import { TestValidator } from "@nestia/e2e";
import crypto from "crypto";

import api from "@api";

/**
 * Verifies @EncryptedBody exposes no padding oracle: a forged ciphertext whose
 * PKCS#5 padding is broken and one whose padding is valid but whose plaintext
 * is not JSON must produce the identical failure response.
 *
 * `AesPkcs5` is unauthenticated AES-CBC, so a body can be forged. The decorator
 * used to catch the decrypt failure as a 400 while letting the JSON.parse
 * failure escape as a 500. Those two observable status codes are a padding
 * oracle (GHSA-pqj4-gvf7-6fq5): one bit per request recovers plaintext byte by
 * byte without the key. Both failure modes must now collapse into one
 * indistinguishable 400, and neither may be a 500.
 *
 * 1. Encrypt a valid JSON login body with the connection's own key/iv and POST the
 *    raw ciphertext; it must succeed (the wire format is unchanged).
 * 2. Flip the last ciphertext byte to break the final block's padding, and flip
 *    the first ciphertext byte so CBC corrupts the early plaintext into
 *    non-JSON while the final block's padding survives.
 * 3. Assert neither forged request returns 500 and that the two responses are
 *    identical in both status (400) and body.
 *
 * @evidence contracts/testing.md#behavioral-verification A valid independently encrypted login succeeds below300, while broken-padding and valid-padding/non-JSON forgeries both return400 with identical bodies.
 * @evidence contracts/testing.md#independent-expectations Node crypto independently constructs AES-CBC ciphertext using the fixture key/IV. The security contract requires indistinguishable client-visible failures; expected400/body equality is not copied from generated server output.
 * @evidence contracts/testing.md#distinguishing-cases Valid plaintext, final-block corruption and early-block corruption contrast successful decrypt, padding rejection and JSON rejection. The test observes HTTP responses rather than timing, so it does not establish timing-side-channel equivalence.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Raw forged wire bodies bypass generated-client validation and reach actual decrypt/parser/error boundaries. A unit catching decrypt errors alone cannot prove JSON failures share the same HTTP response.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_api_encrypted_padding_oracle = async (
  connection: api.IConnection,
): Promise<void> => {
  const password: { key: string; iv: string } = connection.encryption as {
    key: string;
    iv: string;
  };

  // INDEPENDENT ORACLE: encrypt with Node crypto, not the code under test
  const encrypt = (plain: string): Buffer => {
    const cipher = crypto.createCipheriv(
      `aes-${password.key.length * 8}-cbc`,
      password.key,
      password.iv,
    );
    return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  };
  const send = async (
    bytes: Buffer,
  ): Promise<{ status: number; body: string }> => {
    const response: Response = await fetch(
      `${connection.host}/sellers/authenticate/login`,
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: bytes.toString("base64"),
      },
    );
    return { status: response.status, body: await response.text() };
  };

  // VALID CIPHERTEXT STILL SUCCEEDS (no wire-format change)
  const ciphertext: Buffer = encrypt(
    JSON.stringify({
      email: "someone@someone.com",
      password: "qweqwe123!",
    }),
  );
  const ok = await send(ciphertext);
  TestValidator.equals(
    "valid ciphertext still decrypts",
    true,
    ok.status < 300,
  );

  // (a) BROKEN PKCS#5 PADDING: decrypt throws
  const flip = (buffer: Buffer, index: number): Buffer => {
    buffer.writeUInt8(buffer.readUInt8(index) ^ 0x01, index);
    return buffer;
  };
  const brokenPadding: Buffer = flip(
    Buffer.from(ciphertext),
    ciphertext.length - 1,
  );

  // (b) VALID PADDING, NON-JSON PLAINTEXT: JSON.parse throws
  const garbageJson: Buffer = flip(Buffer.from(ciphertext), 0);

  const a = await send(brokenPadding);
  const b = await send(garbageJson);

  // NO 500 LEAK, AND THE TWO FAILURES ARE INDISTINGUISHABLE
  TestValidator.equals("decrypt failure is not a 500", 400, a.status);
  TestValidator.equals("json failure is not a 500", 400, b.status);
  TestValidator.equals(
    "padding oracle closed: same status",
    a.status,
    b.status,
  );
  TestValidator.equals("padding oracle closed: same body", a.body, b.body);
};
