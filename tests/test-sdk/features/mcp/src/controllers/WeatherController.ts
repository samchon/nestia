import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface IWeatherInput {
  location: string;
  unit?: "celsius" | "fahrenheit";
  coords?: {
    lat: number;
    lng: number;
  };
}

export interface IWeatherResult {
  location: string;
  temperature: number;
  unit: "celsius" | "fahrenheit";
  conditions: string;
}

@Controller()
export class WeatherController {
  /**
   * Return the current weather for a named location. Optional coords object
   * exercises nested JSON Schema generation.
   */
  @core.McpRoute({ name: "get_weather" })
  public async get(
    @core.McpRoute.Params() params: IWeatherInput,
  ): Promise<IWeatherResult> {
    const unit = params.unit ?? "celsius";
    return {
      location: params.location,
      temperature: unit === "fahrenheit" ? 72 : 22,
      unit,
      conditions: "sunny",
    };
  }
}
