import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Verifies source-private and actual typia errors retain distinct Swagger
 * schemas.
 *
 * A local TypeGuardError spelling must not inherit typia's synthetic error
 * shape. The barrel-imported typia twin provides the positive special-case
 * control.
 *
 * 1. Generate the original local409 and imported typia400 exception annotations.
 * 2. Require both exact references and the local reason:string component.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual local409 must reference TypeGuardError with reason.type string, while actual typia400 must reference TypeGuardErrorany. All three original literal comparisons remain.
 * @evidence contracts/testing.md#independent-expectations The nonexport local interface defines reason:string and the barrel reexports actual typia TypeGuardError as ValidationError. Original annotations establish409 versus400 independently of generated schemas.
 * @evidence contracts/testing.md#distinguishing-cases Same-spelled local error contrasts an actual typia declaration through a type-only barrel alias; exact refs and local property shape detect both incorrect special-casing and missing special-casing.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one matching export and reads the current document after actual generation. Missing components/response refs fail the awaited case.
 * @evidence contracts/e2e.md#necessary-boundary Native declaration provenance must reach serialized Swagger exception schemas through actual compilation and reflection. Authored-metadata generator units cannot establish this source-private/barrel connection.
 * @evidence contracts/e2e.md#shared-execution The shared producer, All, consumer and installation supply these artifacts with no new compiler/application; this case starts no server or process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A native_boundary route prefix isolates endpoints while original TypeGuardError and ValidationError identities remain unchanged. Immutable reads are scoped to the current sandbox.
 * @evidence contracts/e2e.md#preserved-coverage Original assertNativeTypeGuardProvenance local409 reference, reason string and typia400 reference are preserved. Only the route prefix changes; original feature and separate source-input loader ownership remain pending verified transfer.
 */
export const test_native_exception_provenance_swagger =
  async (): Promise<void> => {
    const document = JSON.parse(
      await fs.readFile(
        path.resolve(__dirname, "../../../swagger.json"),
        "utf8",
      ),
    );
    assert.equal(
      document.paths?.["/native_boundary/provenance/local"]?.get
        ?.responses?.[409]?.content?.["application/json"]?.schema?.$ref,
      "#/components/schemas/TypeGuardError",
    );
    assert.equal(
      document.components?.schemas?.TypeGuardError?.properties?.reason?.type,
      "string",
    );
    assert.equal(
      document.paths?.["/native_boundary/provenance/typia"]?.get
        ?.responses?.[400]?.content?.["application/json"]?.schema?.$ref,
      "#/components/schemas/TypeGuardErrorany",
    );
  };
