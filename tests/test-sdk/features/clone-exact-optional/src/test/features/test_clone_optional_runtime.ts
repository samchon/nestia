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
 * @evidence contracts/testing.md#behavioral-verification Round-trips omitted and populated cloned inputs on Express and Fastify and rejects missing required or mistyped optional values.
 * @evidence contracts/testing.md#independent-expectations The authored IOptional DTO permits omission but retains required neighbors and optional value types.
 * @evidence contracts/testing.md#distinguishing-cases Both HTTP adapters, omitted and present optionals, missing required values, invalid strings and null preserve the full existing matrix.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Round-trips omitted and populated cloned inputs on Express and Fastify and rejects missing required or mistyped optional values. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Both HTTP adapters, omitted and present optionals, missing required values, invalid strings and null preserve the full existing matrix. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
