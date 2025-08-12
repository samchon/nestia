import core from "@nestia/core";

/**
 * Example MCP controller demonstrating various tool types.
 * This controller provides utility functions that LLMs can use.
 */
export class UtilityController extends core.McpController("utilities") {
  /**
   * Generate a random UUID.
   */
  @core.McpRoute({
    name: "generate_uuid",
    description: "Generate a random UUID (Universally Unique Identifier)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  public async generateUuid(): Promise<{ uuid: string }> {
    return {
      uuid: crypto.randomUUID(),
    };
  }

  /**
   * Get current timestamp information.
   */
  @core.McpRoute({
    name: "get_timestamp",
    description: "Get current timestamp in various formats",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["iso", "unix", "human"],
          description: "Output format (default: iso)",
        },
      },
    },
  })
  public async getTimestamp(params: { format?: "iso" | "unix" | "human" }): Promise<{
    timestamp: string | number;
    format: string;
  }> {
    const now = new Date();
    const format = params.format || "iso";

    switch (format) {
      case "unix":
        return { timestamp: Math.floor(now.getTime() / 1000), format };
      case "human":
        return { timestamp: now.toLocaleString(), format };
      default:
        return { timestamp: now.toISOString(), format };
    }
  }

  /**
   * Encode text to Base64.
   */
  @core.McpRoute({
    name: "base64_encode",
    description: "Encode text to Base64 format",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to encode",
        },
      },
      required: ["text"],
    },
  })
  public async base64Encode(params: { text: string }): Promise<{ encoded: string }> {
    return {
      encoded: Buffer.from(params.text, "utf8").toString("base64"),
    };
  }

  /**
   * Decode Base64 to text.
   */
  @core.McpRoute({
    name: "base64_decode",
    description: "Decode Base64 format to text",
    inputSchema: {
      type: "object",
      properties: {
        encoded: {
          type: "string",
          description: "Base64 encoded text to decode",
        },
      },
      required: ["encoded"],
    },
  })
  public async base64Decode(params: { encoded: string }): Promise<{ text: string }> {
    try {
      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(params.encoded)) {
        throw new Error("Invalid Base64 format");
      }
      
      const decoded = Buffer.from(params.encoded, "base64").toString("utf8");
      
      // Additional validation: try to encode back and compare
      const reencoded = Buffer.from(decoded, "utf8").toString("base64");
      if (reencoded !== params.encoded) {
        throw new Error("Invalid Base64 input - decoding verification failed");
      }
      
      return { text: decoded };
    } catch (error) {
      throw new Error("Invalid Base64 input");
    }
  }

  /**
   * Calculate hash of text.
   */
  @core.McpRoute({
    name: "calculate_hash",
    description: "Calculate hash of input text using specified algorithm",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to hash",
        },
        algorithm: {
          type: "string",
          enum: ["md5", "sha1", "sha256"],
          description: "Hash algorithm (default: sha256)",
        },
      },
      required: ["text"],
    },
  })
  public async calculateHash(params: {
    text: string;
    algorithm?: "md5" | "sha1" | "sha256";
  }): Promise<{ hash: string; algorithm: string }> {
    const crypto = require("crypto");
    const algorithm = params.algorithm || "sha256";

    const hash = crypto.createHash(algorithm).update(params.text).digest("hex");

    return { hash, algorithm };
  }

  /**
   * Validate JSON format.
   */
  @core.McpRoute({
    name: "validate_json",
    description: "Validate if a string is valid JSON and optionally format it",
    inputSchema: {
      type: "object",
      properties: {
        json: {
          type: "string",
          description: "JSON string to validate",
        },
        format: {
          type: "boolean",
          description: "Whether to return formatted JSON (default: false)",
        },
      },
      required: ["json"],
    },
  })
  public async validateJson(params: {
    json: string;
    format?: boolean;
  }): Promise<{ valid: boolean; formatted?: string; error?: string }> {
    try {
      const parsed = JSON.parse(params.json);
      const result: any = { valid: true };

      if (params.format) {
        result.formatted = JSON.stringify(parsed, null, 2);
      }

      return result;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }
}