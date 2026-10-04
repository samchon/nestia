import core from "@nestia/core";
import { BadRequestException } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import assert from "assert/strict";
import typia, { tags } from "typia";

interface IPayload {
  id?: string & tags.Format<"uuid">;
  title: string;
  count: number;
}

/**
 * Verifies emitted validation helpers reach the actual body decorator with
 * their acceptance, clone and prune semantics intact.
 *
 * The authored payload and literal mode rows define the expectations. The Go
 * body-option units own global option selection; this shared consumer owns
 * installed helper execution and the body argument protocol, without compiling
 * ten independent global-option projects.
 *
 * 1. Attach each real validator to an isolated parameter-decorator fixture.
 * 2. Invoke Nest's registered factory with valid, surplus and malformed bodies.
 * 3. Check rejection status, retained fields and raw-body/argument identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Native-emitted assert, is, validate, equality, clone and prune helpers execute through the actual TypedBody factory. Valid and surplus values must preserve the literal fields and identity policy; malformed declared fields and equality surplus must raise BadRequestException with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations IPayload is independently authored with optional UUID id, string title and numeric count. Literal acceptance and raw/argument alias rows distinguish structural, equality, clone and prune contracts; expected data is not obtained from emitted code.
 * @evidence contracts/testing.md#distinguishing-cases All ten helper variants have valid, surplus and wrong-count cases. Clone must retain the raw surplus but remove it from a distinct argument; prune must remove it from the original and argument; equality must reject surplus; structural variants accept it. Header/query/parameter global family routing belongs to the Go matrix.
 * @evidence contracts/testing.md#execution-ownership The shared SDK consumer discovers this matching case. Its source is transformed with the real composed native plugin, then it calls installed typia helpers and the actual core/Nest parameter-decorator protocol; no unit entry performs this native preparation.
 * @evidence contracts/e2e.md#necessary-boundary Native-emitted helper code must execute with installed typia and core's registered parameter factory. Source-transform discriminator and helper-name units cannot establish successful returned data, mutation or runtime exception translation across that connection.
 * @evidence contracts/e2e.md#shared-execution Every helper is emitted in the existing HTTP consumer program. The case builds no project or native host and opens no application; it shares the producer and consumer preparation already needed by all HTTP scenarios.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each mode attaches metadata to a fresh owned fixture class and each invocation receives a fresh payload/request/context. No foreign method or module is replaced, and no metadata or request is reused between mode assertions.
 * @evidence contracts/e2e.md#preserved-coverage The old transform-options assertValidate acceptance and extra-field mutation observations survive for all ten modes. Actual body argument identity, valid data equality and wrong-declared-field HTTP 400 strengthen those observations. Global option selection stays in owning Go units rather than being claimed by these explicit validators.
 */
export const test_api_body_validator_variants = (): void => {
  const cases: Array<{
    name: string;
    validator: Parameters<typeof core.TypedBody<IPayload>>[0];
    rejectExtra: boolean;
    rawExtra: boolean;
    argumentExtra: boolean;
    sameIdentity: boolean;
  }> = [
    {
      name: "assert",
      validator: { type: "assert", assert: typia.createAssert<IPayload>() },
      rejectExtra: false,
      rawExtra: true,
      argumentExtra: true,
      sameIdentity: true,
    },
    {
      name: "is",
      validator: { type: "is", is: typia.createIs<IPayload>() },
      rejectExtra: false,
      rawExtra: true,
      argumentExtra: true,
      sameIdentity: true,
    },
    {
      name: "validate",
      validator: {
        type: "validate",
        validate: typia.createValidate<IPayload>(),
      },
      rejectExtra: false,
      rawExtra: true,
      argumentExtra: true,
      sameIdentity: true,
    },
    {
      name: "assertEquals",
      validator: {
        type: "assert",
        assert: typia.createAssertEquals<IPayload>(),
      },
      rejectExtra: true,
      rawExtra: false,
      argumentExtra: false,
      sameIdentity: true,
    },
    {
      name: "equals",
      validator: { type: "is", is: typia.createEquals<IPayload>() },
      rejectExtra: true,
      rawExtra: false,
      argumentExtra: false,
      sameIdentity: true,
    },
    {
      name: "validateEquals",
      validator: {
        type: "validate",
        validate: typia.createValidateEquals<IPayload>(),
      },
      rejectExtra: true,
      rawExtra: false,
      argumentExtra: false,
      sameIdentity: true,
    },
    {
      name: "assertClone",
      validator: {
        type: "assert",
        assert: typia.plain.createAssertClone<IPayload>(),
      },
      rejectExtra: false,
      rawExtra: true,
      argumentExtra: false,
      sameIdentity: false,
    },
    {
      name: "validateClone",
      validator: {
        type: "validate",
        validate: typia.plain.createValidateClone<IPayload>(),
      },
      rejectExtra: false,
      rawExtra: true,
      argumentExtra: false,
      sameIdentity: false,
    },
    {
      name: "assertPrune",
      validator: {
        type: "assert",
        assert: typia.plain.createAssertPrune<IPayload>(),
      },
      rejectExtra: false,
      rawExtra: false,
      argumentExtra: false,
      sameIdentity: true,
    },
    {
      name: "validatePrune",
      validator: {
        type: "validate",
        validate: typia.plain.createValidatePrune<IPayload>(),
      },
      rejectExtra: false,
      rawExtra: false,
      argumentExtra: false,
      sameIdentity: true,
    },
  ];

  for (const row of cases) {
    class Fixture {
      public route(_input: IPayload): void {}
    }
    core.TypedBody(row.validator)(Fixture.prototype, "route", 0);
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Fixture, "route");
    const registrations = Object.values(metadata) as Array<{
      factory(data: unknown, context: ExecutionContextHost): IPayload;
    }>;
    assert.equal(registrations.length, 1, `${row.name}: factory registration`);
    const factory = registrations[0]!.factory;
    const invoke = (body: unknown): IPayload => {
      const request = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      };
      return factory(
        undefined,
        new ExecutionContextHost([request], Fixture, Fixture.prototype.route),
      );
    };
    const valid = {
      id: "00000000-0000-4000-8000-000000000001",
      title: "title",
      count: 1,
    };
    assert.deepEqual(invoke(valid), valid, `${row.name}: valid data`);
    const optionalAbsent = invoke({ title: "title", count: 1 });
    assert.equal(optionalAbsent.id, undefined, `${row.name}: optional absence`);
    assert.equal(optionalAbsent.title, "title", `${row.name}: absent-id title`);
    assert.equal(optionalAbsent.count, 1, `${row.name}: absent-id count`);
    const surplus = { title: "title", count: 1, extra: "x" };
    const rejectsWith400 = (error: unknown): boolean =>
      error instanceof BadRequestException && error.getStatus() === 400;
    if (row.rejectExtra)
      assert.throws(
        () => invoke(surplus),
        rejectsWith400,
        `${row.name}: surplus rejection`,
      );
    else {
      const result = invoke(surplus);
      assert.equal("extra" in surplus, row.rawExtra, `${row.name}: raw fields`);
      assert.equal(
        "extra" in result,
        row.argumentExtra,
        `${row.name}: argument fields`,
      );
      assert.equal(
        result === surplus,
        row.sameIdentity,
        `${row.name}: argument identity`,
      );
      assert.equal(result.title, "title", `${row.name}: title preservation`);
      assert.equal(result.count, 1, `${row.name}: count preservation`);
    }
    assert.throws(
      () => invoke({ title: "title", count: "wrong" }),
      rejectsWith400,
      `${row.name}: wrong declared field rejection`,
    );
  }
};
