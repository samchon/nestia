import { TestValidator } from "@nestia/e2e";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { FastifyAdapter } from "@nestjs/platform-fastify";

import api from "../../api";
import { IOptional } from "../../api/structures/IOptional";
import { OptionalController } from "../../controllers/OptionalController";

@Module({ controllers: [OptionalController] })
class ApplicationModule {}

/**
 * Verifies generated clients send omitted optional properties on both adapters.
 *
 * A cloned input must permit empty optional members while server validation
 * still rejects a missing required member or an incorrectly typed optional
 * one.
 *
 * 1. Boot the same controller with Express and Fastify on ephemeral ports.
 * 2. Call the generated SDK with omitted and populated optional properties.
 * 3. Send one-axis invalid bodies and require HTTP 400 from both adapters.
 *
 * @evidence contracts/testing.md#behavioral-verification Both Express and Fastify must echo omitted/populated optional bodies, return the literal inline required object, reject missing required/wrong string/null optional bodies with400 and combine omitted optional query/header values as queryheader.
 * @evidence contracts/testing.md#independent-expectations The handwritten OptionalController echoes its typed input, returns required ok inline and concatenates required query/header strings. The authored DTO excludes missing required and string/null optional boolean neighbors independently of generated validators.
 * @evidence contracts/testing.md#distinguishing-cases Omitted/populated/inline positives contrast three one-axis invalid bodies on both adapters; omission also crosses query and header parsing. Assignment/property cases own compile-time undefined, mapped and declaration distinctions.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects generated SDK encoders, native server validators, real Express/Fastify parsers and response transport. In-process predicates cannot establish both adapter connections.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Both adapters reuse the same generated/compiled artifacts but own necessary separate ephemeral-port host lifetimes for their middleware distinction. Each app closes in finally; request objects are local and rejected raw responses are consumed before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
 */
export const test_clone_optional_runtime = async (): Promise<void> => {
  const input: IOptional = {
    required: "ok",
    nested: { requiredInner: true },
    partial: {},
    requiredMapped: { fixed: "ok" },
    generic: {},
    classValue: {},
    alias: {},
    intersection: { right: "ok" },
    union: { kind: "a" },
    array: [{}],
    tuple: ["ok", true],
  };
  for (const adapter of [new ExpressAdapter(), new FastifyAdapter()]) {
    const app = await NestFactory.create(ApplicationModule, adapter, {
      logger: false,
    });
    try {
      await app.listen(0, "127.0.0.1");
      const host = await app.getUrl();
      TestValidator.equals(
        "omitted optional body",
        await api.functional.optional.echo({ host }, input),
        input,
      );
      const populated = {
        ...input,
        optional: true,
        nullable: null,
        explicit: "value",
      };
      TestValidator.equals(
        "present optional body",
        await api.functional.optional.echo({ host }, populated),
        populated,
      );
      TestValidator.equals(
        "inline response",
        await api.functional.optional.inline({ host }),
        { required: "ok" },
      );
      const { required: _required, ...missing } = input;
      for (const invalid of [
        missing,
        { ...input, optional: "wrong" },
        { ...input, optional: null },
      ]) {
        const response = await fetch(`${host}/optional`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalid),
        });
        TestValidator.equals("invalid body status", response.status, 400);
        await response.arrayBuffer();
      }
      TestValidator.equals(
        "optional query and headers omitted",
        await api.functional.optional.query(
          { host, headers: { "x-required": "header" } },
          { required: "query" },
        ),
        "queryheader",
      );
    } finally {
      await app.close();
    }
  }
};
