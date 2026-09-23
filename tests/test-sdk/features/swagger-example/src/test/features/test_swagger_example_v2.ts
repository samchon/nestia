import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies a Swagger 2.0 document generates from routes with named examples.
 *
 * Swagger 2.0 keys a response's examples by MIME type and gives a body
 * parameter only a schema, so it holds neither named examples nor a request
 * body example. typia's downgrader refuses a document that has them, so a
 * project with one named body example could not generate 2.0 at all (#1649).
 * The generator leaves out what 2.0 cannot hold and keeps the single response
 * example, which 2.0 carries under its MIME type.
 *
 * 1. Read the Swagger 2.0 document the second configuration generated.
 * 2. Assert the create and update bodies carry no example.
 * 3. Assert each success response carries its single example by MIME type.
 */
export const test_swagger_example_v2 = async (): Promise<void> => {
  const swagger: any = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../../v2.swagger.json`,
      "utf-8",
    ),
  );
  TestValidator.equals("version", swagger.swagger, "2.0");
  for (const [path, method] of [
    ["/bbs/articles", "post"],
    ["/bbs/articles/{id}", "put"],
  ] as const) {
    const body: any = swagger.paths[path][method].parameters.find(
      (p: any) => p.in === "body",
    );
    TestValidator.equals(
      `${method} ${path} body`,
      Object.keys(body).filter((key) => key.includes("example")),
      [],
    );
  }
  typia.assert<IBbsArticle>(
    swagger.paths["/bbs/articles"].post.responses["201"].examples[
      "application/json"
    ],
  );
  typia.assert<IBbsArticle>(
    swagger.paths["/bbs/articles/{id}"].put.responses["200"].examples[
      "application/json"
    ],
  );
};
