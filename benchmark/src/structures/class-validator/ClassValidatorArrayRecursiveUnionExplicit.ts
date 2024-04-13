import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

class Explicit {
  @cv.IsNumber()
  id!: number;

  @cv.IsString()
  name!: string;

  @cv.IsString()
  path!: string;

  @cv.IsString()
  @cv.IsIn(["directory", "file"])
  type!: string;

  @cv.IsOptional()
  @cv.IsString()
  @cv.IsIn(["jpg", "txt", "zip", "lnk"])
  extension?: string;

  @tr.Type(() => Explicit)
  @cv.IsOptional()
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  children?: Explicit[];

  @cv.IsOptional()
  @cv.IsNumber()
  width?: number;

  @cv.IsOptional()
  @cv.IsNumber()
  height?: number;

  @cv.IsOptional()
  @cv.IsString()
  url?: string;

  @cv.IsOptional()
  @cv.IsNumber()
  size?: number;

  @cv.IsOptional()
  @cv.IsString()
  content?: string;

  @cv.IsOptional()
  @cv.IsNumber()
  count?: number;

  @tr.Type(() => Explicit)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  target?: Explicit;
}

export class ClassValidatorArrayRecursiveUnionExplicit {
  @tr.Type(() => Explicit)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  data!: Explicit[];
}
