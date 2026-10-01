import crypto from "crypto";

/**
 * Utility class for the AES-128/256 encryption.
 *
 * - AES-128/256
 * - CBC mode
 * - PKCS#5 Padding
 * - Base64 Encoding
 *
 * The key and the initializer vector are strings that Node reads as UTF-8
 * bytes. The variant is chosen by the key's byte length: 16, 24, and 32 bytes
 * select AES-128, AES-192, and AES-256, and any other length is refused by the
 * cipher.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation The functions call Node's `createCipheriv` and `createDecipheriv` with AES in CBC mode, whose default padding is PKCS#5/PKCS#7, and exchange base64 text; the variant is derived from the key's UTF-8 byte length, which is the length Node actually reads, so a key of 16, 24, or 32 bytes selects AES-128, AES-192, or AES-256 and any other length is refused by the cipher. CBC carries no authentication tag, so the format offers confidentiality without integrity; the mode and encoding are fixed by the wire format `@nestia/core`'s encrypted decorators use, so this namespace cannot change them alone.
 * @evidence contracts/common.md#clear-and-simple-design Two functions with the same three inputs and no state; the variant selection is one expression in each because the two directions share nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The primitives are the platform's crypto module with no custom cipher, padding, or key derivation; nothing is hardcoded to a key or an initializer vector.
 * @evidence contracts/common.md#meaningful-documentation The comment names the algorithm, the mode, the padding, and the encoding, and states how the key length selects the variant.
 */
export namespace AesPkcs5 {
  /**
   * Encrypt data
   *
   * @param data Target data
   * @param key Key value of the encryption.
   * @param iv Initializer Vector for the encryption
   * @returns Encrypted data
   * @evidence contracts/common.md#principled-implementation The plain text is read as UTF-8, encrypted in CBC mode with the key and the initializer vector, and emitted as base64 by concatenating the update and final outputs, so the result decrypts to the same text with the same key and vector.
   * @evidence contracts/common.md#clear-and-simple-design A single expression over one cipher object, with the cipher name derived from the key in the line above.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The key and the vector come only from the caller, and a key of unsupported size makes Node throw instead of being padded or truncated.
   * @evidence contracts/common.md#meaningful-documentation The parameters and the return value are documented, and the namespace comment states the byte-length rule for the key.
   */
  export function encrypt(data: string, key: string, iv: string): string {
    const bytes: number = Buffer.byteLength(key, "utf8") * 8;
    const cipher = crypto.createCipheriv(`AES-${bytes}-CBC`, key, iv);
    return cipher.update(data, "utf8", "base64") + cipher.final("base64");
  }

  /**
   * Decrypt data.
   *
   * @param data Target data
   * @param key Key value of the decryption.
   * @param iv Initializer Vector for the decryption
   * @returns Decrypted data.
   * @evidence contracts/common.md#principled-implementation The base64 text is decrypted in CBC mode with the key and the initializer vector, and the update and final outputs are concatenated as UTF-8, so `decrypt(encrypt(x))` returns `x`; wrong keys or corrupted text make the final block check throw rather than return garbage silently in the usual case, although CBC without a tag cannot detect every alteration.
   * @evidence contracts/common.md#clear-and-simple-design A single expression over one decipher object, mirroring `encrypt`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the platform's decipher and does not catch its errors, so a padding or key failure reaches the caller.
   * @evidence contracts/common.md#meaningful-documentation The parameters and the return value are documented, and the namespace comment states the byte-length rule for the key.
   */
  export function decrypt(data: string, key: string, iv: string): string {
    const bytes: number = Buffer.byteLength(key, "utf8") * 8;
    const decipher = crypto.createDecipheriv(`AES-${bytes}-CBC`, key, iv);
    return decipher.update(data, "base64", "utf8") + decipher.final("utf8");
  }
}
