import { BadRequestException, ExecutionContext } from "@nestjs/common";
import type express from "express";
import type { FastifyReply } from "fastify";

export const send_bad_request =
    (context: ExecutionContext) =>
    (error: BadRequestException): void => {
        const response: express.Response | FastifyReply = context
            .switchToHttp()
            .getResponse();
        response.status(error.getStatus()).send(error.getResponse());
    };
