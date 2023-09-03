import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("operationId")
export class OperationIdController {
    /**
     * @operationId some-custom-operation-id
     */
    @TypedRoute.Get("custom")
    public async custom(): Promise<void> {}
}
