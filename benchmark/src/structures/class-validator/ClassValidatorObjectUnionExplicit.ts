import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

class Point {
  @cv.IsNumber()
  x!: number;

  @cv.IsNumber()
  y!: number;
}

class Polyline {
  @tr.Type(() => Point)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  points!: Point[];
}

class Explicit {
  @cv.IsString()
  @cv.IsIn([
    "point",
    "line",
    "triangle",
    "rectangle",
    "polyline",
    "polygon",
    "circle",
  ])
  type!: string;

  @cv.IsOptional()
  @cv.IsNumber()
  x?: number;

  @cv.IsOptional()
  @cv.IsNumber()
  y?: number;

  @tr.Type(() => Point)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  p1?: Point;

  @tr.Type(() => Point)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  p2?: Point;

  @tr.Type(() => Point)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  p3?: Point;

  @cv.IsOptional()
  @cv.ValidateNested()
  @cv.IsObject()
  @tr.Type(() => Point)
  p4?: Point;

  @tr.Type(() => Point)
  @cv.IsOptional()
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  points?: Point[];

  @tr.Type(() => Polyline)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  outer?: Polyline;

  @tr.Type(() => Polyline)
  @cv.IsOptional()
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  inner?: Polyline[];

  @tr.Type(() => Point)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  centroid?: Point;

  @cv.IsOptional()
  @cv.IsNumber()
  radius?: number;
}

export class ClassValidatorObjectUnionExplicit {
  @tr.Type(() => Explicit)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  data!: Explicit[];
}
