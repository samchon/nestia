import { MetadataSchema } from "@typia/core";

/**
 * Shared object-only constraint check for MCP parameter and return schemas.
 *
 * MCP requires both `inputSchema` and `outputSchema` (when present) to be a
 * single, static object type — no primitives, no unions, no dynamic-key
 * records. Parameter types additionally cannot be empty (a tool must accept
 * an object); return types may be empty (`void` short-circuited upstream).
 *
 * @internal
 * @author wildduck - https://github.com/wildduck2
 */
export const check_mcp_object =
  (kind: "params" | "return") =>
  (metadata: MetadataSchema): string[] => {
    const errors: string[] = [];
    if (metadata.objects.length === 0)
      errors.push(
        kind === "return"
          ? "MCP tool return type must be an object type or `void`."
          : "MCP tool parameters must be an object type.",
      );
    else if (metadata.objects.length > 1 || metadata.size() > 1)
      errors.push(
        `MCP tool ${kind === "return" ? "return type" : "parameters"} must be a single object type.`,
      );
    else if (
      metadata.objects[0]!.type.properties.some(
        (p) => p.key.isSoleLiteral() === false,
      )
    )
      errors.push(
        `MCP tool ${kind === "return" ? "return type" : "parameters"} must not declare dynamic keys (Record<string, X>, index signatures).`,
      );
    return errors;
  };
