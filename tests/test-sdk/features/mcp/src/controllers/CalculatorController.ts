import core from "@nestia/core";
import { BadRequestException, Controller } from "@nestjs/common";

export interface ICalcInput {
  a: number;
  b: number;
}

export interface ICalcResult {
  result: number;
}

export interface INotifyInput {
  message: string;
}

/**
 * MCP tool fixture covering the happy path (`add`, `subtract`) and the
 * `HttpException` mapping path (`divide`).
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class CalculatorController {
  /** Return the sum of two numbers. */
  @core.McpRoute("add")
  public async add(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a + params.b };
  }

  /** Return the difference a - b. */
  @core.McpRoute("subtract")
  public async subtract(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    return { result: params.a - params.b };
  }

  /** Return a / b. Throws on division by zero. */
  @core.McpRoute("divide")
  public async divide(
    @core.McpRoute.Params() params: ICalcInput,
  ): Promise<ICalcResult> {
    if (params.b === 0)
      throw new BadRequestException("Division by zero is not allowed.");
    return { result: params.a / params.b };
  }

  /** Accept a notification without returning content. */
  @core.McpRoute("notify")
  public async notify(
    @core.McpRoute.Params() params: INotifyInput,
  ): Promise<void> {
    void params;
  }
}
