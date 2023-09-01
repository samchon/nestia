import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("param")
export class TypedParamController {
    @core.TypedRoute.Get(":value/boolean")
    public boolean(@core.TypedParam("value") value: boolean): boolean {
        return value;
    }

    @core.TypedRoute.Get(":value/number")
    public number(@core.TypedParam("value") value: number): number {
        return value;
    }

    @core.TypedRoute.Get(":value/string")
    public string(@core.TypedParam("value") value: string): string {
        return value;
    }

    @core.TypedRoute.Get(":value/nullable")
    public nullable(
        @core.TypedParam("value") value: string | null,
    ): string | null {
        return value;
    }

    @core.TypedRoute.Get(":value/literal")
    public literal(
        @core.TypedParam("value") value: "A" | "B" | "C",
    ): "A" | "B" | "C" {
        return value;
    }

    @core.TypedRoute.Get(":value/uuid")
    public uuid(
        @core.TypedParam("value") value: string & tags.Format<"uuid">,
    ): string {
        return value;
    }

    @core.TypedRoute.Get(":value/date")
    public date(
        @core.TypedParam("value") value: string & tags.Format<"date">,
    ): string {
        return value;
    }

    @core.TypedRoute.Get(":value/uuid_nullable")
    public uuid_nullable(
        @core.TypedParam("value") value: (string & tags.Format<"uuid">) | null,
    ): string | null {
        return value;
    }

    @core.TypedRoute.Get(":value/date_nullable")
    public date_nullable(
        @core.TypedParam("value") value: (string & tags.Format<"date">) | null,
    ): string | null {
        return value;
    }
}
