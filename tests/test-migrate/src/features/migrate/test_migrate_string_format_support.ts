import { TestValidator } from "@nestia/e2e";
import { NestiaMigrateApplication } from "@nestia/migrate";

/**
 * Verifies the string formats that become `tags.Format` are exactly the ones
 * typia's `Format` tag supports.
 *
 * The migrated DTO tags a string with its OpenAPI `format` only when typia can
 * validate it, so an unknown format must stay a plain string instead of naming
 * a tag that does not exist. The supported set was kept in a table of regular
 * expressions that nothing read except for its keys; it is now a plain set, and
 * this case pins that the membership did not change.
 *
 * 1. Generate an SDK from a schema with one string property per format, the 22
 *    typia formats, binary and four formats typia does not have.
 * 2. Read the emitted DTO file.
 * 3. Assert each supported format carries its `Format` tag, `binary` becomes
 *    `File`, and the unsupported ones carry no format tag.
 *
 * @evidence contracts/testing.md#behavioral-verification The SDK generator runs end to end over a schema that exercises every supported and several unsupported formats, and the emitted DTO text is inspected per property, so a missing or extra member of the set changes a line.
 * @evidence contracts/testing.md#independent-expectations The 22 supported names are the members of typia's tags.Format union, listed by hand from the typia documentation, not read from the migrate table.
 * @evidence contracts/testing.md#distinguishing-cases Supported formats are the positives, binary is the file boundary, and int32, double, unknown-format and an empty format are the negatives that must not produce a tag.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-migrate process, generating files in memory with the built migrate application; no file or network is used.
 */
export function test_migrate_string_format_support(): void {
  const supported: string[] = [
    "byte",
    "password",
    "regex",
    "uuid",
    "email",
    "hostname",
    "idn-email",
    "idn-hostname",
    "iri",
    "iri-reference",
    "ipv4",
    "ipv6",
    "uri",
    "uri-reference",
    "uri-template",
    "url",
    "date-time",
    "date",
    "time",
    "duration",
    "json-pointer",
    "relative-json-pointer",
  ];
  const unsupported: string[] = ["int32", "double", "unknown-format", ""];
  const property = (format: string) => ({ type: "string", format });
  const properties: Record<string, object> = {};
  for (const [index, format] of [
    ...supported,
    "binary",
    ...unsupported,
  ].entries())
    properties[`p${index}`] = property(format);

  const app: NestiaMigrateApplication = NestiaMigrateApplication.assert({
    openapi: "3.1.0",
    info: { title: "formats", version: "1.0.0" },
    paths: {
      "/formats": {
        get: {
          responses: {
            200: {
              description: "formats",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IFormats" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        IFormats: {
          type: "object",
          properties,
          required: Object.keys(properties),
        },
      },
    },
  } as any);
  const text: string =
    app.sdk({ keyword: true, simulate: false, e2e: false, package: "formats" })[
      "src/structures/IFormats.ts"
    ] ?? "";
  TestValidator.predicate("the DTO file is emitted", text.length !== 0);

  const line = (index: number): string =>
    text.split("\n").find((l) => l.trim().startsWith(`p${index}:`)) ?? "";
  const all: string[] = [...supported, "binary", ...unsupported];
  all.forEach((format, index) => {
    const found: string = line(index);
    if (supported.includes(format))
      TestValidator.predicate(
        `${format} is tagged`,
        found.includes(`tags.Format<"${format}">`),
      );
    else if (format === "binary")
      TestValidator.predicate(`${format} is a File`, found.includes("File"));
    else
      TestValidator.predicate(
        `${JSON.stringify(format)} is not tagged`,
        found.length !== 0 && found.includes("Format<") === false,
      );
  });
}
