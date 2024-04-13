import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

class Point3D {
  @cv.IsNumber()
  public x!: number;

  @cv.IsNumber()
  public y!: number;

  @cv.IsNumber()
  public z!: number;
}

class Simple {
  @tr.Type(() => Point3D)
  @cv.IsObject()
  @cv.ValidateNested()
  public scale!: Point3D;

  @tr.Type(() => Point3D)
  @cv.IsObject()
  @cv.ValidateNested()
  public position!: Point3D;

  @tr.Type(() => Point3D)
  @cv.IsObject()
  @cv.ValidateNested()
  public rotate!: Point3D;

  @tr.Type(() => Point3D)
  @cv.IsObject()
  @cv.ValidateNested()
  public pivot!: Point3D;
}

export class ClassValidatorObjectSimple {
  @tr.Type(() => Simple)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  public data!: Simple[];
}
