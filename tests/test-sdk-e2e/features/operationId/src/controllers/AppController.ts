import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController, ApiExcludeEndpoint } from "@nestjs/swagger";

@Controller()
export class AppController {
  /** @internal */
  @Get("internal")
  public internal(): Array<number> {
    return [0];
  }

  /** @ignore */
  @Get("hidden")
  public hidden(): Array<number> {
    return [0];
  }

  /** @ignore */
  @Get("ignore")
  public ignore(): Array<number> {
    return [0];
  }

  @ApiExcludeEndpoint()
  @Get("swagger-excluded-endpoint")
  public swagger_excluded_endpoint(): Array<number> {
    return [0];
  }

  @ApiExcludeEndpoint(false)
  @Get("swagger-visible-endpoint")
  public swagger_visible_endpoint(): Array<number> {
    return [0];
  }
}

@ApiExcludeController()
@Controller("swagger-excluded-controller")
export class SwaggerExcludedController {
  @Get()
  public swagger_excluded_controller(): Array<number> {
    return [0];
  }
}
