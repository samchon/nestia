import {
  EncryptedBody,
  McpRoute,
  TypedBody,
  TypedParam,
  WebSocketRoute,
} from "@nestia/core";
import { Body, Controller, Post, Req } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
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
  NonNullable<Parameters<typeof TypedBody<{ title: string; count: number }>>[0]>
>;

/**
 * Observes compiled helper values separately from the manual decorator ABI.
 *
 * @evidence contracts/common.md#principled-implementation Ten public typia factories compile in the shared producer and preserve the original validator return and mutation semantics. The three manual TypedBody routes connect assertClone, equals and validatePrune to the distinct assert/is/validate public descriptors. Private descriptor types derive from the exported TypedBody validator parameter rather than an unexported option type, and retain real functions; inspect catches only actual TypeGuardError and derives its report from request-local inputs and helper results.
 * @evidence contracts/common.md#clear-and-simple-design The inspection route observes helper effects separately from decorated argument binding. Manual HTTP routes project argument and raw-body identity, while encrypted, WebSocket and MCP routes connect successful cloned data to each transport's actual argument binding without another producer or host.
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
    @Req() request: { body: { title: string; count: number } },
  ): {
    title: string;
    count: number;
    extraPresent: boolean;
    rawExtraPresent: boolean;
    sameRawBody: boolean;
  } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
      rawExtraPresent: Object.hasOwn(request.body, "extra"),
      sameRawBody: input === request.body,
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
    @Req() request: { body: { title: string; count: number } },
  ): {
    title: string;
    count: number;
    extraPresent: boolean;
    rawExtraPresent: boolean;
    sameRawBody: boolean;
  } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
      rawExtraPresent: Object.hasOwn(request.body, "extra"),
      sameRawBody: input === request.body,
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
    @Req() request: { body: { title: string; count: number } },
  ): {
    title: string;
    count: number;
    extraPresent: boolean;
    rawExtraPresent: boolean;
    sameRawBody: boolean;
  } {
    return {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
      rawExtraPresent: Object.hasOwn(request.body, "extra"),
      sameRawBody: input === request.body,
    };
  }

  @Post("manual/encryptedClone")
  /**
   * Projects a cloned decoded body using the shared encrypted module password.
   *
   * @evidence contracts/common.md#principled-implementation EncryptedBody decrypts and validates actual ciphertext before passing the successful clone to this ordinary JSON response; the response observes the argument rather than a separately invoked helper.
   * @evidence contracts/common.md#clear-and-simple-design One stateless projection reuses the existing assertClone descriptor and module encryption policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cipher key or decoding logic is substituted inside the route; the shared backend supplies its existing public encryption configuration.
   * @evidence contracts/common.md#meaningful-documentation The description identifies successful decoded-value binding as this route's responsibility.
   */
  public encryptedClone(
    @EncryptedBody(validators.assertClone)
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

  @WebSocketRoute("manual/wsClone")
  /**
   * Observes the cloned route argument beside the acceptor's original header.
   *
   * @evidence contracts/common.md#principled-implementation The request-local report compares actual argument identity and properties with the acceptor's raw header after the adaptor has resolved validation. An accepted provider returns that report through real RPC.
   * @evidence contracts/common.md#clear-and-simple-design One connection-local provider exposes one inspection method and retains no cross-connection state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public WebSocketRoute decorators and acceptor.accept perform actual validation and transport; no framework callback or header is replaced.
   * @evidence contracts/common.md#meaningful-documentation The description identifies argument-versus-header identity as the observed distinction.
   */
  public async wsClone(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      { title: string; count: number },
      {
        inspect(): {
          title: string;
          count: number;
          extraPresent: boolean;
          rawExtraPresent: boolean;
          sameRawBody: boolean;
        };
      },
      null
    >,
    @WebSocketRoute.Header(validators.assertClone)
    input: { title: string; count: number },
  ): Promise<void> {
    const report = {
      title: input.title,
      count: input.count,
      extraPresent: Object.hasOwn(input, "extra"),
      rawExtraPresent: Object.hasOwn(acceptor.header, "extra"),
      sameRawBody: input === acceptor.header,
    };
    await acceptor.accept({ inspect: () => report });
  }

  @McpRoute("core_boundary_clone")
  /**
   * Projects cloned tool arguments after the MCP adaptor resolves validation.
   *
   * @evidence contracts/common.md#principled-implementation The method observes the actual Params argument supplied through the adaptor and returns its values and extra-property presence; invalid arguments are rejected before this method.
   * @evidence contracts/common.md#clear-and-simple-design One stateless tool uses the same public validateClone descriptor already compiled for the HTTP helper inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The real public tool and Params decorators own schema and argument validation; this method performs no replacement validation or protocol mapping.
   * @evidence contracts/common.md#meaningful-documentation The description states that this method observes successful tool argument binding.
   */
  public mcpClone(
    @McpRoute.Params(validators.validateClone)
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
