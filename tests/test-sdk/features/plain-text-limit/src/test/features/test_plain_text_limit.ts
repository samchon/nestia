import { TestValidator } from "@nestia/e2e";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import { INestApplication } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import net from "net";

import api from "@api";

import { Backend, ENCRYPTION } from "../../Backend";

/**
 * Verifies a `text/plain` body on Express obeys the size limit Express gives
 * the other bodies, unless the application registers its own text parser, and a
 * body that cannot be read answers a client error.
 *
 * `@PlainBody()` and `@EncryptedBody()` read an unparsed Express text body with
 * no limit, so a 5 MB body was accepted where the same JSON answered 413, and a
 * truncated body answered 500 (#1711). Fastify already enforced its
 * `bodyLimit`.
 *
 * 1. On Express, send 50 kB and 200 kB bodies to both decorators: the first is
 *    read, the second answers 413.
 * 2. With `app.useBodyParser("text", { limit: "10mb" })`, read a 5 MB body.
 * 3. Send a body shorter than its `Content-Length`: 400.
 * 4. On Fastify, a 50 kB body is read through the SDK as before.
 */
export const test_plain_text_limit = async (
  connection: api.IConnection,
): Promise<void> => {
  const within: string = "x".repeat(50 * 1024);
  const over: string = "x".repeat(200 * 1024);

  // the default limit, on both decorators
  for (const [title, body, status] of [
    ["within", within, 201],
    ["over", over, 413],
  ] as const) {
    TestValidator.equals(
      `plain ${title}`,
      (await send(connection.host, "plain", body)).status,
      status,
    );
    TestValidator.equals(
      `encrypted ${title}`,
      (
        await send(
          connection.host,
          "encrypted",
          AesPkcs5.encrypt(
            JSON.stringify({ value: body }),
            ENCRYPTION.key,
            ENCRYPTION.iv,
          ),
        )
      ).status,
      status,
    );
  }

  // an application's own text parser sets the limit
  const large: NestExpressApplication = await Backend.express();
  large.useBodyParser("text", { limit: "10mb" });
  await large.listen(0, "127.0.0.1");
  try {
    const host: string = (await large.getUrl()).replace("[::1]", "127.0.0.1");
    const response: Response = await send(
      host,
      "plain",
      "x".repeat(5 * 1024 * 1024),
    );
    TestValidator.equals("own parser status", response.status, 201);
    TestValidator.equals("own parser length", await response.json(), {
      length: 5 * 1024 * 1024,
    });
  } finally {
    await large.close();
  }

  // a body shorter than it declared
  TestValidator.equals(
    "truncated",
    await truncated(connection.host, "/text/plain"),
    400,
  );

  // Fastify, unchanged
  const fastify: INestApplication = await Backend.fastify();
  await fastify.listen(0, "127.0.0.1");
  try {
    const host: string = (await fastify.getUrl()).replace("[::1]", "127.0.0.1");
    TestValidator.equals(
      "fastify plain",
      await api.functional.text.plain({ host }, within),
      { length: within.length },
    );
    TestValidator.equals(
      "fastify encrypted",
      await api.functional.text.encrypted(
        { host, encryption: ENCRYPTION },
        { value: within },
      ),
      { length: within.length },
    );
  } finally {
    await fastify.close();
  }
};

const send = (host: string, path: string, body: string): Promise<Response> =>
  fetch(`${host}/text/${path}`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body,
  });

/**
 * The status answered to a request that declares 100 bytes, sends 10, and
 * closes its side, as a client dropping mid-body does.
 */
const truncated = (host: string, path: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const url: URL = new URL(host);
    const socket: net.Socket = net.connect(
      { host: url.hostname, port: Number(url.port), allowHalfOpen: true },
      () => {
        socket.write(
          [
            `POST ${path} HTTP/1.1`,
            `Host: ${url.host}`,
            "Content-Type: text/plain",
            "Content-Length: 100",
            "Connection: close",
            "",
            "0123456789",
          ].join("\r\n"),
        );
        socket.end();
      },
    );
    let text: string = "";
    socket.on("data", (chunk) => (text += chunk.toString()));
    socket.on("error", reject);
    socket.on("close", () => {
      const status: RegExpMatchArray | null = text.match(/^HTTP\/1\.1 (\d+)/);
      if (status === null) reject(new Error(`no response: ${text}`));
      else resolve(Number(status[1]));
    });
  });
