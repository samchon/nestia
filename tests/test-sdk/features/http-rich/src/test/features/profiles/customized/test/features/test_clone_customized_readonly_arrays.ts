import fs from "fs";
import { OpenApi } from "typia";

import { assertReadonlyArraySchema } from "../../../../internal/RichReadonlyArraySchema";

/**
 * Verifies readonly array type positions are emitted as a vendor extension
 * without conflating them with readonly object properties.
 *
 * Locks the generated Swagger distinction between `prop: readonly T[]` and
 * `readonly prop: T[]` for both interface and type-alias DTO declarations.
 * OpenAPI `readOnly` already means response-only property, so the SDK must
 * expose TypeScript array immutability through `x-readonly-array` while
 * preserving existing property mutability behavior.
 *
 * 1. Generate Swagger from a controller returning interface and type-alias shapes
 *    containing both readonly arrays and readonly properties.
 * 2. Read the generated component schemas from `swagger.json`.
 * 3. Assert only the array-type cases carry `x-readonly-array`.
 *
 * @evidence contracts/testing.md#behavioral-verification Both interface and alias retain all original mutable, misleading-name, readonly-array and readonly-property extension/readOnly distinctions.
 * @evidence contracts/testing.md#independent-expectations Original authored routes, DTOs, decorator values and literal assertions define the expected result independently of emitted artifacts.
 * @evidence contracts/testing.md#distinguishing-cases Both interface and alias retain all original mutable, misleading-name, readonly-array and readonly-property extension/readOnly distinctions.
 * @evidence contracts/testing.md#execution-ownership The matching exported case executes through DynamicExecutor in the shared compiled customized-profile consumer; it reads the actual document or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The native return-type metadata and installed Swagger writer must distinguish immutable array types from readonly properties in both emitted interface and alias component schemas.
 * @evidence contracts/e2e.md#shared-execution The two original SDK/Swagger configurations are identical and their controllers join one generation graph, one shared producer/consumer and one listener. Neither original fixture enables automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private source/controller/type/route identities isolate the graph. Customizers address its own routes and the document belongs to this profile; the authored request handlers retain their original state behavior.
 * @evidence contracts/e2e.md#preserved-coverage Every original assertion and failure branch remains with only private identities, imports, accessors and artifact paths changed. The readonly comparison helper retains its complete assertion body.
 */
export const test_clone_customized_readonly_arrays =
  async (): Promise<void> => {
    const content: string = await fs.promises.readFile(
      `${__dirname}/../../../../../../../profiles/customized/swagger.json`,
      "utf8",
    );
    const swagger: OpenApi.IDocument = JSON.parse(content);
    assertReadonlyArraySchema(
      "interface",
      swagger.components!.schemas!.RichIReadonlyArrayDto as any,
    );
    assertReadonlyArraySchema(
      "type alias",
      swagger.components!.schemas!.RichIReadonlyArrayAliasDto as any,
    );
  };
