import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";

import { IBbsArticle } from "../../api/structures/IBbsArticle";

/**
 * Verifies a Swagger 2.0 document generates from routes whose bodies or
 * responses carry what 2.0 has no place for.
 *
 * Swagger 2.0 keys a response's examples by MIME type and gives a body
 * parameter only a schema, so it holds neither named examples nor a request
 * body example, nor an encryption flag, and one operation's responses share one
 * list of media types. It spreads a form into one `formData` parameter per
 * field, which carry neither the body's description nor the form object's
 * attributes, hold one file at most, and are each required or not. typia's
 * downgrader refuses a document that has any of them, so one such route made a
 * project unable to generate 2.0 at all (#1649). The generator leaves out what
 * 2.0 cannot hold, keeping the single response example and the encryption
 * warning.
 *
 * 1. Read the Swagger 2.0 document the second configuration generated.
 * 2. Assert the create and update bodies carry no example.
 * 3. Assert each success response carries its single example by MIME type.
 * 4. Assert the encrypted route keeps its warning without the flag, and its JSON
 *    exception its status and description without a body.
 * 5. Assert each form lists its fields, a file array, a nullable file, and an
 *    array of file unions as one optional file each, keeping its description,
 *    and a file array requiring an item as one required file.
 * 6. Assert the exception with named examples lists none.
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

  const encrypted: any = swagger.paths["/downgrade/encrypted"].post;
  const body: any = encrypted.parameters.find((p: any) => p.in === "body");
  TestValidator.equals(
    "encrypted flag",
    [
      body["x-nestia-encrypted"],
      encrypted.responses["201"]["x-nestia-encrypted"],
    ],
    [undefined, undefined],
  );
  TestValidator.equals(
    "encrypted warning",
    body.description.includes("Request body must be encrypted."),
    true,
  );
  TestValidator.equals("encrypted exception", encrypted.responses["404"], {
    description: "not found",
  });

  const fields = (path: string): string[] =>
    swagger.paths[path].post.parameters
      .map((p: any) => `${p.in}:${p.name}:${p.required === true}`)
      .sort();
  TestValidator.equals("form", fields("/downgrade/form"), [
    "formData:attachments:false",
    "formData:cover:true",
    "formData:maybe:false",
    "formData:memo:false",
    "formData:mixed:false",
    "formData:thumbnail:false",
    "formData:title:true",
  ]);
  const files: any[] = swagger.paths["/downgrade/form"].post.parameters.filter(
    (p: any) => ["attachments", "thumbnail", "mixed", "maybe"].includes(p.name),
  );
  TestValidator.equals(
    "form files",
    files.map((p) => p.type),
    ["file", "file", "file", "file"],
  );
  TestValidator.equals(
    "form file description",
    files.find((p) => p.name === "mixed")?.description,
    "Any of a file or a blob.",
  );
  TestValidator.equals("optional form", fields("/downgrade/optional-form"), [
    "formData:memo:false",
  ]);
  TestValidator.equals(
    "exception examples",
    swagger.paths["/downgrade/exception"].get.responses["404"].examples,
    undefined,
  );
};
