import core, { SwaggerCustomizer } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { OpenApi } from "typia";

import { IPerformance } from "@api/lib/structures/IPerformance";

@Controller("performance")
export class PerformanceController {
  // deliberately not idempotent: each run appends once more
  @SwaggerCustomizer((props) => {
    const response =
      props.route.responses?.["200"]?.content?.["application/json"]?.schema;
    if (!response || !("$ref" in response))
      throw new Error("Performance response must reference its object schema");
    const name = response.$ref
      .substring("#/components/schemas/".length)
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    const schema = props.swagger.components.schemas![
      name
    ] as OpenApi.IJsonSchema.IObject;
    if (!schema)
      throw new Error(`Performance response schema is missing: ${name}`);
    schema.description = `${schema.description ?? ""} Customized.`;
  })
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
