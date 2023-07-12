import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("variable")
export class VariableController {
    @TypedRoute.Get("try")
    public try() {

    }

    @TypedRoute.Get("catch")
    public catch() {

    }

    @TypedRoute.Delete("delete")
    public delete() {

    }

    @TypedRoute.Get("delete")
    public $delete() {

    }

    @TypedRoute.Get("1234")
    public number() {

    }
}