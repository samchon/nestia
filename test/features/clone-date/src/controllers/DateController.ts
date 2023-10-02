import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("date")
export class DateController {
    @core.TypedRoute.Get()
    public get(): IDateDefined {
        return {
            string: new Date().toISOString(),
            date: new Date(),
        };
    }
}

interface IDateDefined {
    /**
     * @format date-time
     */
    string: string;

    date: Date;
}
