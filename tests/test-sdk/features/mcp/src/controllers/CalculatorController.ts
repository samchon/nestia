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
  /** Return the sum of two numbers. */
  @core.McpRoute({ name: "add" })
  public async add(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a + params.b };
  }

  /** Return the difference a - b. */
  @core.McpRoute({ name: "subtract" })
  public async subtract(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a - params.b };
  }

  /** Return a / b. Throws on division by zero. */
  @core.McpRoute({ name: "divide" })
  public async divide(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    if (params.b === 0)
      throw new BadRequestException("Division by zero is not allowed.");
    return { result: params.a / params.b };
  }
}
