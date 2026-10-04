import core, { SwaggerCustomizer } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { OpenApi } from "typia";

import { IConfigurationsPerformance } from "@api/lib/structures/IConfigurationsPerformance";

@Controller("performance")
export class PerformanceController {
  // deliberately not idempotent: each run appends once more
  @SwaggerCustomizer((props) => {
    const schema = props.swagger.components.schemas![
      "IConfigurationsPerformance"
    ] as OpenApi.IJsonSchema.IObject;
    schema.description = `${schema.description ?? ""} Customized.`;
  })
  @core.TypedRoute.Get()
  public async get(): Promise<IConfigurationsPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
