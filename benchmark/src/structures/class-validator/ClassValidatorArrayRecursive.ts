import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

import { ClassValidatorTimestamp } from "./ClassValidatorTimestamp";

class Recursive {
    @cv.IsNumber()
    public id!: number;

    @cv.IsString()
    public code!: string;

    @cv.IsNumber()
    public sequence!: number;

    @tr.Type(() => ClassValidatorTimestamp)
    @cv.IsObject()
    @cv.ValidateNested({ each: true })
    public created_at!: ClassValidatorTimestamp;

    @tr.Type(() => Recursive)
    @cv.IsArray()
    @cv.IsObject({ each: true })
    @cv.ValidateNested({ each: true })
    public children!: Recursive[];
}

export class ClassValidatorArrayRecursive {
    @tr.Type(() => Recursive)
    @cv.IsArray()
    @cv.IsObject({ each: true })
    @cv.ValidateNested({ each: true })
    public data!: Recursive[];
}
