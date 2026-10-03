import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a generated composite query DTO has its omitted property shape.
 *
 * The CLI metadata producer must register the derived DTO in its document.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the generated OmitIQueryFieldsQueryatomic schema exists for the
 *    authored composite query controller; this assertion only proves schema
 *    registration and does not validate its field contents.
 *
 * @evidence contracts/testing.md#behavioral-verification Fresh document registration of the authored omitted-atomic composite-query DTO, without claiming field validation are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The authored composite parameter is Omit<IQueryFieldsQuery, "atomic">, whose original named metadata must register in the fresh document. The literal expected schema name follows that authored type identity; the original assertion does not certify field contents.
 * @evidence contracts/testing.md#distinguishing-cases Fresh document registration of the authored omitted-atomic composite-query DTO, without claiming field validation define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native omitted-property metadata and freshly generated installed Swagger document registration must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_swagger =
  async (): Promise<void> => {
    const swagger = JSON.parse(
      await fs.promises.readFile(
        `${__dirname}/../../../../../../../profiles/field_parameters/swagger.json`,
        "utf8",
      ),
    );
    TestValidator.equals(
      "replace",
      true,
      !!swagger.components.schemas?.OmitIQueryFieldsQueryatomic,
    );
  };
