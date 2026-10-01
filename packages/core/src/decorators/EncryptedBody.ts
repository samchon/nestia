import { IEncryptionPassword } from "@nestia/fetcher";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { Singleton } from "../utils/Singleton";
import { get_encryption_password } from "./internal/get_encryption_password";
import { get_text_body } from "./internal/get_text_body";
import { headers_to_object } from "./internal/headers_to_object";
import { is_media_type } from "./internal/is_media_type";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Encrypted body decorator.
 *
 * `EncryptedBody` is a decorator function getting `application/json` typed data
 * from request body which has been encrypted by AES-128/192/256 algorithm.
 * Also, `EncryptedBody` validates the request body data type through
 * [typia](https://github.com/samchon/typia) ad the validation speed is maximum
 * 15,000x times faster than `class-validator`.
 *
 * For reference, when the request body data is not following the promised type
 * `T`, `BadRequestException` error (status code: 400) would be thrown. Also,
 * `EncryptedRoute` decrypts request body using those options.
 *
 * - AES-128/192/256
 * - CBC mode
 * - PKCS #5 Padding
 * - Base64 Encoding
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @returns Parameter decorator
 * @evidence contracts/common.md#principled-implementation The body must be `text/plain` ciphertext; it is decrypted with the password of the controller or module, the plain text is parsed as JSON and validated by the transformed validator, and a decryption or parse failure becomes a 400 with one fixed message that does not echo the ciphertext and does not tell the two failures apart; a key or initialization vector the cipher itself refuses is the server's configuration, independent of the request, and is thrown as it is.
 * @evidence contracts/common.md#clear-and-simple-design One parameter decorator composed of the shared text reading, password lookup, and validator runner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The algorithm comes from `AesPkcs5` of the fetcher, the same one the client uses, and no key is embedded; a missing password is an error rather than a plain pass-through.
 * @evidence contracts/common.md#meaningful-documentation The comment describes the protocol and the requirement of a password on the controller or module, and the private decode helper documents why every decryption failure collapses into one response.
 */
export function EncryptedBody<T>(
  validator?: IRequestBodyValidator<T>,
): ParameterDecorator {
  const checker = validate_request_body("EncryptedBody")(validator);
  return createParamDecorator(async function EncryptedBody(
    _unknown: any,
    context: ExecutionContext,
  ) {
    const request: express.Request | FastifyRequest = context
      .switchToHttp()
      .getRequest();
    if (is_media_type(request.headers["content-type"], "text/plain") === false)
      throw new BadRequestException(`Request body type is not "text/plain".`);

    const param: IEncryptionPassword | IEncryptionPassword.Closure | undefined =
      get_encryption_password(context.getClass());
    if (!param)
      throw new Error(
        "Error on nestia.core.EncryptedBody(): no encryption password is given.",
      );

    // GET BODY DATA
    const headers: Singleton<Record<string, string>> = new Singleton(() =>
      headers_to_object(request.headers),
    );
    const body: string = await get_text_body(request);
    const password: IEncryptionPassword =
      typeof param === "function"
        ? param({ headers: headers.get(), body, direction: "decode" })
        : param;

    // PARSE AND VALIDATE DATA
    const data: any = decode(body, password.key, password.iv);
    const error: Error | null = checker(data);
    if (error !== null) throw error;
    return data;
  })();
}

/**
 * Decrypt and JSON-parse the request body behind a single failure response.
 *
 * `AesPkcs5` is AES-CBC without an authentication tag, so a MITM attacker can
 * forge ciphertexts. Splitting the two failure modes of a forged body — a bad
 * PKCS#5 padding (decryption throws) versus valid padding whose plaintext is
 * not JSON (`JSON.parse` throws) — into two different HTTP status codes turns
 * this decorator into a padding oracle: one observable bit per request lets the
 * attacker recover the plaintext byte by byte without the key
 * (GHSA-pqj4-gvf7-6fq5).
 *
 * Both failure modes must therefore collapse into one indistinguishable
 * `BadRequestException` (identical status, message, and body). Only the
 * downstream type validation of an already-parsed body may report its own
 * distinct error, because reaching it requires plaintext the attacker cannot
 * forge without already knowing it.
 *
 * A key or initialization vector the cipher refuses is thrown as it is. It says
 * nothing about the body, so it opens no oracle, and it is a defect of the
 * server's configuration that a 400 would blame on the client.
 *
 * @internal
 */
const decode = (body: string, key: string, iv: string): unknown => {
  try {
    return JSON.parse(AesPkcs5.decrypt(body, key, iv));
  } catch (exp) {
    // A password the cipher itself refuses is the server's configuration, which
    // no request body can influence, so it is no oracle and no client's fault.
    if (exp instanceof Error && PASSWORD_ERRORS.has((exp as any).code))
      throw exp;
    else if (exp instanceof Error)
      throw new BadRequestException(
        "Failed to decrypt the request body. Check your body content or encryption password.",
      );
    else throw exp;
  }
};

/** The error codes of a key or an initialization vector the cipher refuses. */
const PASSWORD_ERRORS: Set<unknown> = new Set([
  "ERR_INVALID_ARG_TYPE",
  "ERR_CRYPTO_INVALID_IV",
  "ERR_CRYPTO_INVALID_KEYLEN",
  "ERR_CRYPTO_UNKNOWN_CIPHER",
]);
