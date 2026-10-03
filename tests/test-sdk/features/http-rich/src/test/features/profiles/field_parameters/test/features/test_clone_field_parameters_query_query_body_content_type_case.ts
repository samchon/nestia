import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies URL-encoded bodies accept mixed-case media types with a charset
 * parameter.
 *
 * The raw HTTP header reaches decorator media-type normalization without
 * generated metadata hiding its case.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and
 *    preserve every authored field in the response query text.
 *
 * @evidence contracts/testing.md#behavioral-verification HTTP201 and exact four wire fields under mixed-case form media type with charset are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases HTTP201 and exact four wire fields under mixed-case form media type with charset define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_query_body_content_type_case =
  async (connection: api.IConnection): Promise<void> => {
    const input = new URLSearchParams({
      atomic: "atomic",
      limit: "10",
      enforce: "true",
      values: "value",
    });
    const response: Response = await fetch(
      `${connection.host}/http_rich/options/field_parameters/query/query/body`,
      {
        method: "POST",
        headers: {
          "Content-Type": "Application/X-Www-Form-Urlencoded; Charset=UTF-8",
        },
        body: input,
      },
    );
    TestValidator.equals("status", response.status, 201);

    const output = new URLSearchParams(await response.text());
    TestValidator.equals("atomic", output.get("atomic"), input.get("atomic"));
    TestValidator.equals("limit", output.get("limit"), input.get("limit"));
    TestValidator.equals(
      "enforce",
      output.get("enforce"),
      input.get("enforce"),
    );
    TestValidator.equals("values", output.get("values"), input.get("values"));
  };
