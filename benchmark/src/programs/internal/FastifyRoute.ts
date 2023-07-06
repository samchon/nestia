import {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
    UseInterceptors,
    applyDecorators,
} from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import fastJsonStringify from "fast-json-stringify";
import { FastifyReply } from "fastify";
import { catchError, map, throwError } from "rxjs";
import typia from "typia";

export const FastifyRoute = (doc: typia.IJsonApplication) => {
    const stringify = fastJsonStringify({
        ...doc.schemas[0],
        ...doc,
    });
    const interceptor = UseInterceptors(new FastGetInterceptor(stringify));
    return (method: (path: string) => MethodDecorator) => (path: string) =>
        applyDecorators(method(path), interceptor);
};

class FastGetInterceptor implements NestInterceptor {
    public constructor(private readonly stringify: (input: any) => string) {}

    public intercept(context: ExecutionContext, next: CallHandler) {
        const http: HttpArgumentsHost = context.switchToHttp();
        const response: FastifyReply = http.getResponse();
        response.header("Content-Type", "application/json");

        return next.handle().pipe(
            map((value) => this.stringify(value)),
            catchError((err) => throwError(() => err)),
        );
    }
}
