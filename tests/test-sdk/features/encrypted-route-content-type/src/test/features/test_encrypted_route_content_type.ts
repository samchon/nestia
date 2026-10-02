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
 * `text/html`, so every encrypted response on Express contradicted the document
 * (#1702). Fastify already answered `text/plain`.
 *
 * 1. On the harness's Express application and on a Fastify application serving the
 *    same controller, read the content type of an encrypted GET, and of a route
 *    that throws.
 * 2. Round-trip a GET and a POST through the SDK on both.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks success text/plain and JSON 404 responses plus encrypted GET and POST round trips on Express and Fastify.
 * @evidence contracts/testing.md#independent-expectations Encrypted success is a textual ciphertext wire format; ordinary Nest error responses retain JSON.
 * @evidence contracts/testing.md#distinguishing-cases Both adapters, success/error media types and GET/POST client calls retain their separate observable controls.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks success text/plain and JSON 404 responses plus encrypted GET and POST round trips on Express and Fastify. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Both adapters, success/error media types and GET/POST client calls retain their separate observable controls. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
  try {
    await fastify.listen(0, "127.0.0.1");
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
      await success.arrayBuffer();
      const failure: Response = await fetch(`${host}/echo/missing`);
      TestValidator.equals(`${adapter} error status`, failure.status, 404);
      TestValidator.equals(
        `${adapter} error`,
        mediaType(failure.headers.get("content-type")),
        "application/json",
      );
      await failure.arrayBuffer();

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
