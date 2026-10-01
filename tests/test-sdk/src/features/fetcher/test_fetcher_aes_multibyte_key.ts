import { TestValidator } from "@nestia/e2e";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import crypto from "crypto";

/**
 * Verifies `AesPkcs5` picks the cipher by the key's byte length, not by its
 * character count.
 *
 * The key length was read as `key.length`, so a key of eight Korean characters,
 * which is 24 bytes in UTF-8, asked for AES-64 and threw an unknown cipher
 * error instead of using AES-192.
 *
 * 1. Encrypt a text with a 16-byte, a 24-byte, and a 32-byte ASCII key and with an
 *    8-character key that is 24 bytes in UTF-8, and assert the ciphertext
 *    equals the one Node's crypto gives for the named AES variant.
 * 2. Assert every ciphertext decrypts back to the original text.
 * 3. Assert keys of 8 and 16 characters that are not 16, 24 or 32 bytes in UTF-8
 *    are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification It encrypts and decrypts through `AesPkcs5` with 16-, 24-, and 32-byte keys and one 8-character Korean key of 24 bytes, so a cipher chosen by character count throws an unknown cipher error for the last, and a wrong variant gives a ciphertext that differs from the reference. Keys whose byte length selects no AES variant must throw.
 * @evidence contracts/testing.md#independent-expectations The expected ciphertext is produced by Node's `crypto.createCipheriv` with the variant named explicitly by the test (`aes-128-cbc`, `aes-192-cbc`, `aes-256-cbc`), which implements AES-CBC with PKCS#7 padding, identical to PKCS#5 padding for 16-byte blocks, independently of `AesPkcs5`; the round trip is the second oracle.
 * @evidence contracts/testing.md#distinguishing-cases The three key sizes are the positive cases, the multibyte key is the adjacent input whose character count differs from its byte length, and an 8-character ASCII key and a 16-character Korean key (48 bytes) are the negative cases whose character count or byte length selects no variant.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process and calls `AesPkcs5` from the fetcher package in-process with Node's own crypto; nothing is installed, built, or served.
 */
export function test_fetcher_aes_multibyte_key(): void {
  const iv: string = "0123456789abcdef";
  const text: string = "비밀 메시지 - secret message";
  for (const [title, key, variant] of [
    ["aes-128", "0123456789abcdef", "aes-128-cbc"],
    ["aes-192", "0123456789abcdef01234567", "aes-192-cbc"],
    ["aes-256", "0123456789abcdef0123456789abcdef", "aes-256-cbc"],
    ["multibyte aes-192", "가나다라마바사아", "aes-192-cbc"],
  ] as const) {
    const encrypted: string = AesPkcs5.encrypt(text, key, iv);
    const cipher = crypto.createCipheriv(
      variant,
      Buffer.from(key, "utf8"),
      Buffer.from(iv, "utf8"),
    );
    TestValidator.equals(
      `${title} ciphertext`,
      encrypted,
      cipher.update(text, "utf8", "base64") + cipher.final("base64"),
    );
    TestValidator.equals(
      `${title} round trip`,
      text,
      AesPkcs5.decrypt(encrypted, key, iv),
    );
  }
  for (const [title, key] of [
    ["short ascii", "01234567"],
    ["long multibyte", "가나다라마바사아자차카타파하가나"],
  ] as const)
    TestValidator.error(title, () => AesPkcs5.encrypt(text, key, iv));
}
