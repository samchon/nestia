import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

import { ClassValidatorTimestamp } from "./ClassValidatorTimestamp";

class Recursive {
  @tr.Type(() => Recursive)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested({ each: true })
  public parent!: Recursive | null;

  @cv.IsNumber()
  public id!: number;

  @cv.IsString()
  public code!: string;

  @cv.IsString()
  public name!: string;

  @cv.IsNumber()
  public sequence!: number;

  @cv.ValidateNested()
  @cv.IsObject()
  @tr.Type(() => ClassValidatorTimestamp)
  public created_at!: ClassValidatorTimestamp;
}

export class ClassValidatorObjectRecursive {
  @tr.Type(() => Recursive)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  public data!: Recursive[];
}
