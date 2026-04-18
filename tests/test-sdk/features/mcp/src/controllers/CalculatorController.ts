import core from "@nestia/core";
import { BadRequestException, Controller } from "@nestjs/common";

export interface ICalcInput {
  a: number;
  b: number;
}

export interface ICalcResult {
  result: number;
}

@Controller()
export class CalculatorController {
  @core.McpRoute({
    name: "add",
    description: "Return the sum of two numbers.",
  })
  public async add(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a + params.b };
  }

  @core.McpRoute({
    name: "subtract",
    description: "Return the difference a - b.",
  })
  public async subtract(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a - params.b };
  }

  @core.McpRoute({
    name: "divide",
    description: "Return a / b. Throws on division by zero.",
  })
  public async divide(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    if (params.b === 0)
      throw new BadRequestException("Division by zero is not allowed.");
    return { result: params.a / params.b };
  }
}
