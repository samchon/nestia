import core from "@nestia/core";
import { INestApplication, Module } from "@nestjs/common";
import { NestFactory, RouterModule } from "@nestjs/core";

const PASSWORD = { key: "A".repeat(32), iv: "B".repeat(16) };

/** Every merged feature's controllers, each mounted at its feature's name. */
export class Backend {
  private application_?: INestApplication;

  public static async create(): Promise<INestApplication> {
    const routes = [
      {
        path: "array",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/array/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "body",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/body/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "body-generic-default",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/body-generic-default/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "body-manual-assert",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/body-manual-assert/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "body-manual-is",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/body-manual-is/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "body-manual-validate",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/body-manual-validate/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "config-pattern",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/config-pattern/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "date",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/date/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "duplicated",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/duplicated/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "escape",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/escape/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "exception-filter",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/exception-filter/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "import-type",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/import-type/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "kebab",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/kebab/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "multipart-form-data",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/multipart-form-data/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "non-equals",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/non-equals/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "operationId",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/operationId/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "param",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/param/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "param-validate",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/param-validate/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "plain-text-parser",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/plain-text-parser/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-assert",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-assert/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-is",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-is/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-stringify",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-stringify/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-validate",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-validate/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-validate-log-encrypted",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-validate-log-encrypted/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "route-manual-validate-log-fastify",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/route-manual-validate-log-fastify/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "source-extension",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/source-extension/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "variable",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/variable/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "websocket",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/websocket/controllers`,
          PASSWORD,
        ),
      },
      {
        path: "websocket-type-alias",
        module: await core.EncryptedModule.dynamic(
          `${__dirname}/features/websocket-type-alias/controllers`,
          PASSWORD,
        ),
      },
    ];
    @Module({
      imports: [...routes.map((r) => r.module), RouterModule.register(routes)],
    })
    class MergedModule {}
    const app: INestApplication = await NestFactory.create(MergedModule, {
      logger: false,
    });
    await core.WebSocketAdaptor.upgrade(app);
    return app;
  }

  public async open(): Promise<void> {
    this.application_ = await Backend.create();
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
