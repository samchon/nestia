import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IParameterFieldsPerformance } from "../../../structures/options/field_parameters/IParameterFieldsPerformance";

@Controller("http_rich/options/field_parameters/param/performance")
export class ParameterFieldsPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IParameterFieldsPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
