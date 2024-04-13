import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

class Hobby {
  @cv.IsString()
  name!: string;

  @cv.IsNumber()
  rank!: number;

  @cv.IsString()
  body!: string;
}

class ArraySimple {
  @cv.IsString()
  name!: string;

  @cv.IsString()
  email!: string;

  @tr.Type(() => Hobby)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  hobbies!: Hobby[];
}

export class ClassValidatorArraySimple {
  @tr.Type(() => ArraySimple)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  data!: ArraySimple[];
}
