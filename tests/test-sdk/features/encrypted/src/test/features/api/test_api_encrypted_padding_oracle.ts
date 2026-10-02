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
 * 2. Flip the penultimate block's last byte to break the final block's padding,
 *    and flip the first ciphertext byte so CBC corrupts the early plaintext
 *    into non-JSON while the final block's padding survives.
 * 3. Assert neither forged request returns 500 and that the two responses are
 *    identical in both status (400) and body.
 *
 * @evidence contracts/testing.md#behavioral-verification Sends valid Node-crypto ciphertext and two corruptions, requiring identical HTTP 400 status and response body for decrypt and JSON failures.
 * @evidence contracts/testing.md#independent-expectations Node crypto constructs the independent AES-CBC oracle; changing the penultimate block last byte deterministically corrupts the final padding byte.
 * @evidence contracts/testing.md#distinguishing-cases A valid positive request contrasts with guaranteed broken padding and preserved-padding non-JSON ciphertext; equality does not claim timing resistance.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Sends valid Node-crypto ciphertext and two corruptions, requiring identical HTTP 400 status and response body for decrypt and JSON failures. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage A valid positive request contrasts with guaranteed broken padding and preserved-padding non-JSON ciphertext; equality does not claim timing resistance. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
    ciphertext.length - 17,
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
