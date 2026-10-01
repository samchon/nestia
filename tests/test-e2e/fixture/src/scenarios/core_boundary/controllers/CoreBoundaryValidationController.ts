import { IRequestBodyValidator, TypedBody, TypedParam } from "@nestia/core";
import { Body, Controller, Post } from "@nestjs/common";
import typia, { TypeGuardError } from "typia";

const validators = {
  assert: {
    type: "assert",
    assert: typia.createAssert<{ title: string; count: number }>(),
  },
  is: { type: "is", is: typia.createIs<{ title: string; count: number }>() },
  validate: {
    type: "validate",
    validate: typia.createValidate<{ title: string; count: number }>(),
  },
  assertEquals: {
    type: "assert",
    assert: typia.createAssertEquals<{ title: string; count: number }>(),
  },
  equals: {
    type: "is",
    is: typia.createEquals<{ title: string; count: number }>(),
  },
  validateEquals: {
    type: "validate",
    validate: typia.createValidateEquals<{ title: string; count: number }>(),
  },
  assertClone: {
    type: "assert",
    assert: typia.plain.createAssertClone<{ title: string; count: number }>(),
  },
  validateClone: {
    type: "validate",
    validate: typia.plain.createValidateClone<{
      title: string;
      count: number;
    }>(),
  },
  assertPrune: {
    type: "assert",
    assert: typia.plain.createAssertPrune<{ title: string; count: number }>(),
  },
  validatePrune: {
    type: "validate",
    validate: typia.plain.createValidatePrune<{
      title: string;
      count: number;
    }>(),
  },
} as const satisfies Record<
  string,
  IRequestBodyValidator<{ title: string; count: number }>
>;

/**
 * Observes compiled helper values separately from the manual decorator ABI.
 *
 * @evidence contracts/common.md#principled-implementation Ten public typia factories compile in the shared producer and preserve the original validator return and mutation semantics. The three manual TypedBody routes connect assertClone, equals and validatePrune to the distinct assert/is/validate public descriptors. Private descriptors retain real functions; inspect catches only actual TypeGuardError and derives its report from request-local inputs and helper results.
 * @evidence contracts/common.md#clear-and-simple-design One inspection route observes helper effects and three routes cover the core runtime's three discriminator branches. Helper return values are observed separately because TypedBody returns the parsed request body, discarding assertion/validation return values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public typia factories and core descriptors execute directly without replaced loaders, decorator probes or production changes. No global compiler option is changed or claimed to have run for each mode.
 * @evidence contracts/common.md#meaningful-documentation The class explains the helper-versus-decorator split and the private request-local observation protocol; methods identify the exact public branch they connect.
 */
@Controller("core_boundary/validation")
export class CoreBoundaryValidationController {
  @Post("inspect/:mode")
  /**
   * Reports actual helper acceptance, identity and extra-property mutation.
   *
   * @evidence contracts/common.md#principled-implementation The method returns values obtained from its actual request and public validator operation.
   * @evidence contracts/common.md#clear-and-simple-design One stateless projection exposes the operation's effect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No literal oracle replaces incoming values or the validator result.
   * @evidence contracts/common.md#meaningful-documentation The description identifies this operation's observed boundary.
   */
  public inspect(
    @TypedParam("mode") mode: keyof typeof validators,
    @Body() input: { title: string; count: number },
  ): {
    accepted: boolean;
    inputExtra: boolean;
    outputExtra: boolean | null;
    sameReference: boolean | null;
    title: string | null;
    count: number | null;
  } {
    const validator = validators[mode];
    let output: { title: string; count: number } | null = null;
    try {
      if (validator.type === "assert") output = validator.assert(input);
      else if (validator.type === "is")
        output = validator.is(input) ? input : null;
      else {
        const result = validator.validate(input);
        if (result.success) output = result.data;
      }
    } catch (error) {
      if (!(error instanceof TypeGuardError)) throw error;
    }
    return {
      accepted: output !== null,
      inputExtra: Object.hasOwn(input, "extra"),
      outputExtra: output === null ? null : Object.hasOwn(output, "extra"),
      sameReference: output === null ? null : output === input,
      title: output === null ? null : output.title,
      count: output === null ? null : output.count,
    };
  }

  @Post("manual/assertClone")
  /**
   * Connects clone assertion success and failure to the manual assert ABI.
   *
   * @evidence contracts/common.md#principled-implementation The method returns values obtained from its actual request and public validator operation.
   * @evidence contracts/common.md#clear-and-simple-design One stateless projection exposes the operation's effect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No literal oracle replaces incoming values or the validator result.
   * @evidence contracts/common.md#meaningful-documentation The description identifies this operation's observed boundary.
   */
  public assertClone(
    @TypedBody(validators.assertClone) input: { title: string; count: number },
  ): { title: string; count: number; extraPresent: boolean } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
    };
  }

  @Post("manual/equals")
  /**
   * Connects equality acceptance and rejection to the manual is ABI.
   *
   * @evidence contracts/common.md#principled-implementation The method returns values obtained from its actual request and public validator operation.
   * @evidence contracts/common.md#clear-and-simple-design One stateless projection exposes the operation's effect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No literal oracle replaces incoming values or the validator result.
   * @evidence contracts/common.md#meaningful-documentation The description identifies this operation's observed boundary.
   */
  public equals(
    @TypedBody(validators.equals) input: { title: string; count: number },
  ): { title: string; count: number; extraPresent: boolean } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
    };
  }

  @Post("manual/validatePrune")
  /**
   * Connects in-place pruning and validation errors to the manual validate ABI.
   *
   * @evidence contracts/common.md#principled-implementation The method returns values obtained from its actual request and public validator operation.
   * @evidence contracts/common.md#clear-and-simple-design One stateless projection exposes the operation's effect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No literal oracle replaces incoming values or the validator result.
   * @evidence contracts/common.md#meaningful-documentation The description identifies this operation's observed boundary.
   */
  public validatePrune(
    @TypedBody(validators.validatePrune)
    input: {
      title: string;
      count: number;
    },
  ): { title: string; count: number; extraPresent: boolean } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
    };
  }
}
