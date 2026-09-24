import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import api from "@api";
import { IEncryptedEcho } from "@api/lib/structures/IEncryptedEcho";

import { ENCRYPTION } from "../../Backend";

/**
 * Verifies an encrypted route's success response is `text/plain`, as the
 * Swagger document declares, on Express and on Fastify, while its error
 * response stays JSON.
 *
 * `@EncryptedRoute` set no content type, and Express sends a string body as
 * `text/html`, so every encrypted response on Express contradicted the
 * document (#1702). Fastify already answered `text/plain`.
 *
 * 1. On the harness's Express application and on a Fastify application serving
 *    the same controller, read the content type of an encrypted GET, and of a
 *    route that throws.
 * 2. Round-trip a GET and a POST through the SDK on both.
 */
export const test_encrypted_route_content_type = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication =
    await NestFactory.create<NestFastifyApplication>(
      await core.EncryptedModule.dynamic(
        `${__dirname}/../../controllers`,
        ENCRYPTION,
      ),
      new FastifyAdapter(),
      { logger: false },
    );
  await fastify.listen(0, "127.0.0.1");
  try {
    const hosts: Array<[string, string]> = [
      ["express", connection.host],
      ["fastify", await url(fastify)],
    ];
    for (const [adapter, host] of hosts) {
      const success: Response = await fetch(`${host}/echo`);
      TestValidator.equals(
        `${adapter} success`,
        mediaType(success.headers.get("content-type")),
        "text/plain",
      );
      const failure: Response = await fetch(`${host}/echo/missing`);
      TestValidator.equals(`${adapter} error status`, failure.status, 404);
      TestValidator.equals(
        `${adapter} error`,
        mediaType(failure.headers.get("content-type")),
        "application/json",
      );

      const sdk: api.IConnection = { host, encryption: ENCRYPTION };
      TestValidator.equals(
        `${adapter} sdk get`,
        await api.functional.echo.get(sdk),
        { value: "get" } satisfies IEncryptedEcho,
      );
      TestValidator.equals(
        `${adapter} sdk post`,
        await api.functional.echo.post(sdk, { value: "post" }),
        { value: "post" } satisfies IEncryptedEcho,
      );
    }
  } finally {
    await fastify.close();
  }
};

const mediaType = (value: string | null): string | null =>
  value === null ? null : value.split(";")[0]!.trim();

const url = async (app: INestApplication): Promise<string> =>
  (await app.getUrl()).replace("[::1]", "127.0.0.1");
