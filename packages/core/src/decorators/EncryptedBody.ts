import { AesPkcs5, IEncryptionPassword } from "@nestia/fetcher";
import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import raw from "raw-body";
import { assert, is, validate } from "typia";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { Singleton } from "../utils/Singleton";
import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";
import { headers_to_object } from "./internal/headers_to_object";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Encrypted body decorator.
 *
 * `EncryptedBody` is a decorator function getting JSON data from HTTP request who've
 * been encrypted by AES-128/256 algorithm. Also, `EncyrptedBody` validates the JSON
 * data type through
 * [`typia.assert()`](https://github.com/samchon/typia#runtime-type-checkers)
 * function and throws `BadRequestException` error (status code: 400), if the JSON
 * data is not following the promised type.
 *
 * For reference, `EncryptedRoute` decrypts request body usnig those options.
 *
 *  - AES-128/256
 *  - CBC mode
 *  - PKCS #5 Padding
 *  - Base64 Encoding
 *
 * @return Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function EncryptedBody<T>(validator?: IRequestBodyValidator<T>) {
    const checker = validate_request_body("EncryptedBody")(validator);
    return createParamDecorator(async function EncryptedBody(
        _unknown: any,
        ctx: ExecutionContext,
    ) {
        const request: express.Request = ctx.switchToHttp().getRequest();
        if (request.readable === false)
            throw new BadRequestException(
                "Request body is not the text/plain.",
            );

        const param:
            | IEncryptionPassword
            | IEncryptionPassword.Closure
            | undefined = Reflect.getMetadata(
            ENCRYPTION_METADATA_KEY,
            ctx.getClass(),
        );
        if (!param)
            throw new Error(
                "Error on nestia.core.EncryptedBody(): no encryption password is given.",
            );

        // GET BODY DATA
        const headers: Singleton<Record<string, string>> = new Singleton(() =>
            headers_to_object(request.headers),
        );
        const body: string = (await raw(request, "utf8")).trim();
        const password: IEncryptionPassword =
            typeof param === "function"
                ? param({ headers: headers.get(), body }, false)
                : param;
        const disabled: boolean =
            password.disabled === undefined
                ? false
                : typeof password.disabled === "function"
                ? password.disabled({ headers: headers.get(), body }, true)
                : password.disabled;

        // PARSE AND VALIDATE DATA
        const data: any = JSON.parse(
            disabled ? body : decrypt(body, password.key, password.iv),
        );
        checker(data);
        return data;
    })();
}
Object.assign(EncryptedBody, assert);
Object.assign(EncryptedBody, is);
Object.assign(EncryptedBody, validate);

/**
 * @internal
 */
function decrypt(body: string, key: string, iv: string): string {
    try {
        return AesPkcs5.decrypt(body, key, iv);
    } catch (exp) {
        if (exp instanceof Error)
            throw new BadRequestException(
                "Failed to decrypt the request body. Check your body content or encryption password.",
            );
        else throw exp;
    }
}
