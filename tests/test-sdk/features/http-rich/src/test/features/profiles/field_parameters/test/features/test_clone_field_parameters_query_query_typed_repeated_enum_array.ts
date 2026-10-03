import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { IQueryFieldsBusinessListingFilters } from "../../../../../../structures/options/field_parameters/IQueryFieldsBusinessListingFilters";
import api from "../../api";

/**
 * Verifies @TypedQuery preserves repeated enum-array query parameters.
 *
 * Locks the native HTTP query decoder branch that must call
 * URLSearchParams.getAll for array DTO properties even when the array is
 * intersected with typia tags. A regression would collapse repeated
 * `sellingType` keys into only the first value and break multi-select filters.
 *
 * 1. Send a generated SDK request with two sellingType values.
 * 2. Let @TypedQuery parse the repeated query keys into the tagged enum array.
 * 3. Assert both values are returned as an array in request order.
 *
 * @evidence contracts/testing.md#behavioral-verification Exact COMPANY/KENNITALA tagged repeated enum-array equality in request order are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases Exact COMPANY/KENNITALA tagged repeated enum-array equality in request order define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_query_typed_repeated_enum_array =
  async (connection: api.IConnection): Promise<void> => {
    const input: IQueryFieldsBusinessListingFilters = {
      sellingType: ["COMPANY", "KENNITALA"],
    };
    const result: IQueryFieldsBusinessListingFilters =
      await api.functional.http_rich.options.field_parameters.query.query.typed_enum_array.typedEnumArray(
        connection,
        input,
      );

    typia.assertEquals(result);
    TestValidator.equals("typed repeated enum array", input, result);
  };
