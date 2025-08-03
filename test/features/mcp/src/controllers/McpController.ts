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
  })
  public async getWeather(params: IWeatherParams): Promise<IWeatherResult> {
    return {
      location: params.location,
      temperature: 22,
      unit: params.unit || "celsius",
      conditions: "sunny",
    };
  }

  @core.McpRoute({
    name: "calculate_sum",
    description: "Calculate the sum of two numbers",
  })
  public async calculateSum(params: { a: number; b: number }): Promise<{ result: number }> {
    return {
      result: params.a + params.b,
    };
  }
}