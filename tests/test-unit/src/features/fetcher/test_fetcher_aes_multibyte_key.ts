import { TestValidator } from "@nestia/e2e";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";

/**
 * Verifies `AesPkcs5` picks the cipher by the key's byte length, not by its
 * character count.
 *
 * The key length was read as `key.length`, so a key of eight Korean characters,
 * which is 24 bytes in UTF-8, asked for AES-64 and threw an unknown cipher
 * error instead of using AES-192.
 *
 * 1. Round-trip a text through a 16-byte, a 24-byte, and a 32-byte ASCII key.
 * 2. Round-trip it through an 8-character key that is 24 bytes in UTF-8.
 * 3. Assert every decrypted text equals the original.
 *
 * @evidence contracts/testing.md#behavioral-verification It encrypts and decrypts through `AesPkcs5` with 16-, 24-, and 32-byte keys and one 8-character Korean key of 24 bytes, so a cipher chosen by character count throws an unknown cipher error for the last.
 * @evidence contracts/testing.md#independent-expectations The oracle is the round trip: decrypting the encryption returns the original text, which holds for any correct AES-CBC and needs no expected ciphertext from the code under test.
 * @evidence contracts/testing.md#distinguishing-cases The three key sizes are the positive cases, and the multibyte key is the adjacent input whose character count differs from its byte length.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process and calls `AesPkcs5` from the fetcher package in-process with Node's own crypto; nothing is installed, built, or served.
 */
export function test_fetcher_aes_multibyte_key(): void {
  const iv: string = "0123456789abcdef";
  const text: string = "비밀 메시지 - secret message";
  for (const [title, key] of [
    ["aes-128", "0123456789abcdef"],
    ["aes-192", "0123456789abcdef01234567"],
    ["aes-256", "0123456789abcdef0123456789abcdef"],
    ["multibyte aes-192", "가나다라마바사아"],
  ] as const)
    TestValidator.equals(
      title,
      text,
      AesPkcs5.decrypt(AesPkcs5.encrypt(text, key, iv), key, iv),
    );
}
