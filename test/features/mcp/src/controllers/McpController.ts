import core from "@nestia/core";

interface IWeatherParams {
  location: string;
  unit?: "celsius" | "fahrenheit";
}

interface IWeatherResult {
  location: string;
  temperature: number;
  unit: string;
  conditions: string;
}

export class McpTestController extends core.McpController("tools") {
  @core.McpRoute({
    name: "get_weather",
    description: "Get current weather information for a specific location",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get weather for",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit (optional, defaults to celsius)",
        },
      },
      required: ["location"],
    },
  })
  public async getWeather(params: IWeatherParams): Promise<IWeatherResult> {
    return {
      location: params.location,
      temperature: params.unit === "fahrenheit" ? 72 : 22,
      unit: params.unit || "celsius",
      conditions: "sunny",
    };
  }

  @core.McpRoute({
    name: "calculate_sum",
    description: "Calculate the sum of two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: {
          type: "number",
          description: "First number",
        },
        b: {
          type: "number", 
          description: "Second number",
        },
      },
      required: ["a", "b"],
    },
  })
  public async calculateSum(params: { a: number; b: number }): Promise<{ result: number }> {
    // Validate input types
    if (typeof params.a !== "number" || typeof params.b !== "number") {
      throw new Error("Both 'a' and 'b' must be numbers");
    }
    
    return {
      result: params.a + params.b,
    };
  }

  @core.McpRoute({
    name: "get_time",
    description: "Get the current time in ISO format",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  public async getTime(): Promise<{ currentTime: string; timezone: string }> {
    return {
      currentTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}