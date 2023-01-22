import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import express from "express";

import { assert } from "typia";

export function TypedQuery(decoder?: (params: URLSearchParams) => any) {
    if (decoder === undefined)
        throw new Error("Error on TypedQuery(): no decoder function provided.");

    return createParamDecorator(async function TypedQuery(
        _unknown: any,
        ctx: ExecutionContext,
    ) {
        const request: express.Request = ctx.switchToHttp().getRequest();
        const params: URLSearchParams = new URLSearchParams(tail(request.url));
        return decoder(params);
    })();
}

/**
 * @internal
 */
export namespace TypedQuery {
    export function boolean(str: string | null): boolean | undefined {
        return str !== null ? Boolean(str) : undefined;
    }
    export function number(str: string | null): number | undefined {
        return str !== null ? Number(str) : undefined;
    }
    export function bigint(str: string | null): bigint | undefined {
        return str !== null ? BigInt(str) : undefined;
    }
    export function string(str: string | null): string | undefined {
        return str ?? undefined;
    }
}
Object.assign(TypedQuery, assert);

function tail(url: string): string {
    const index: number = url.indexOf("?");
    return index === -1 ? "" : url.substring(index + 1);
}
