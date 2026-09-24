import {
  TypedFormData,
  TypedHeaders,
  TypedQuery,
  doNotThrowTransformError,
} from "@nestia/core";
import { Controller, Get, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import Multer from "multer";

// Compiled without the transform: turn the missing-transform error off before
// the decorators below are evaluated, as `@nestia/sdk`'s config loader does.
doNotThrowTransformError(false);

@Controller("fallbacks")
class FallbacksController {
  @Get("headers")
  public headers(@TypedHeaders() headers: Record<string, unknown>): unknown {
    return { isArray: Array.isArray(headers), name: headers["x-name"] };
  }

  @Get("query")
  public query(@TypedQuery() query: Record<string, unknown>): unknown {
    return query;
  }

  @Post("urlencoded")
  public urlencoded(@TypedQuery.Body() body: Record<string, unknown>): unknown {
    return body;
  }

  @Post("multipart")
  public async multipart(
    @TypedFormData.Body(() => Multer()) body: Record<string, unknown>,
  ): Promise<unknown> {
    const file = body.file;
    return {
      title: body.title,
      tags: body.tags,
      file:
        file instanceof File
          ? { name: file.name, text: await file.text() }
          : null,
    };
  }
}

@Module({ controllers: [FallbacksController] })
class FallbacksModule {}

const main = async (): Promise<void> => {
  const app = await NestFactory.create(FallbacksModule, { logger: false });
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  const host = `http://127.0.0.1:${port}/fallbacks`;
  const json = async (response: Response) => ({
    status: response.status,
    body: await response.json(),
  });

  const form = new FormData();
  form.append("title", "hello");
  form.append("tags", "a");
  form.append("tags", "b");
  form.append(
    "file",
    new File(["content"], "note.txt", { type: "text/plain" }),
  );

  const result = {
    headers: await json(
      await fetch(`${host}/headers`, { headers: { "x-name": "abc" } }),
    ),
    query: await json(await fetch(`${host}/query?title=hello&tags=a&tags=b`)),
    urlencoded: await json(
      await fetch(`${host}/urlencoded`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "title=hello&tags=a&tags=b",
      }),
    ),
    multipart: await json(
      await fetch(`${host}/multipart`, { method: "POST", body: form }),
    ),
  };
  await app.close();
  console.log(JSON.stringify(result));
};
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
