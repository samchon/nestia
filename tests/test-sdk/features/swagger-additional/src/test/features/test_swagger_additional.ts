import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { OpenApiConverter } from "@typia/utils";
import fs from "fs";
import path from "path";
import { OpenApi } from "typia";

/**
 * Verifies `swagger.additional` adds the documented extensions to every
 * operation, in the CLI's document, the runtime composer's, and each older
 * OpenAPI version.
 *
 * The option was type-checked and documented, but the Swagger generator rewrite
 * of 2024 dropped the code emitting `x-nestia-method`, `x-nestia-namespace`,
 * and `x-nestia-jsDocTags`, so it did nothing (#1674).
 *
 * 1. Read the operation from the generated document and assert each extension.
 * 2. Compose the document at runtime with the option, and without it.
 * 3. Downgrade to 3.1, 3.0, and 2.0 and assert the extensions survive.
 */
export const test_swagger_additional = async (): Promise<void> => {
  const validate = (title: string, document: any): void => {
    const operation = document.paths["/bbs/articles/{id}"].get;
    TestValidator.equals(
      `${title} method`,
      operation["x-nestia-method"],
      "GET",
    );
    TestValidator.equals(
      `${title} namespace`,
      operation["x-nestia-namespace"],
      "bbs.articles.at",
    );
    TestValidator.equals(
      `${title} jsDocTags`,
      (operation["x-nestia-jsDocTags"] as { name: string }[])
        .map((tag) => tag.name)
        .sort(),
      ["deprecated", "tag"],
    );
  };
  const generated: OpenApi.IDocument = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  validate("cli", generated);

  const app: INestApplication = await NestFactory.create(
    await core.DynamicModule.mount(`${__dirname}/../../controllers`),
    { logger: false },
  );
  try {
    validate(
      "runtime",
      await NestiaSwaggerComposer.document(app, { additional: true }),
    );
    const plain: any = await NestiaSwaggerComposer.document(app, {});
    TestValidator.equals(
      "runtime without option",
      plain.paths["/bbs/articles/{id}"].get["x-nestia-method"],
      undefined,
    );
  } finally {
    await app.close();
  }

  for (const version of ["3.1", "3.0", "2.0"] as const)
    validate(
      version,
      OpenApiConverter.downgradeDocument(
        JSON.parse(JSON.stringify(generated)),
        version as "3.0",
      ),
    );
};
