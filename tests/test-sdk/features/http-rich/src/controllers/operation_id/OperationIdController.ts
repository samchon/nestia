import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/operation_id/operationId")
export class OperationIdOperationIdController {
  /** @operationId some-custom-operation-id */
  @TypedRoute.Get("custom")
  public async custom(): Promise<void> {}
}
