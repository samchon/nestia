import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

import { ClassValidatorTimestamp } from "./ClassValidatorTimestamp";

class Employee {
  @cv.IsNumber()
  id!: number;

  @cv.IsString()
  name!: string;

  @cv.IsNumber()
  age!: number;

  @cv.IsNumber()
  grade!: number;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  employed_at!: ClassValidatorTimestamp;
}

class Department {
  @cv.IsNumber()
  id!: number;

  @cv.IsString()
  code!: string;

  @cv.IsNumber()
  sales!: number;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  created_at!: ClassValidatorTimestamp;

  @tr.Type(() => Employee)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  employees!: Employee[];
}

class Hierarchical {
  @cv.IsNumber()
  id!: number;

  @cv.IsNumber()
  serial!: number;

  @cv.IsString()
  name!: string;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  established_at!: ClassValidatorTimestamp;

  @tr.Type(() => Department)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  departments!: Department[];
}

export class ClassValidatorArrayHierarchical {
  @tr.Type(() => Hierarchical)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  data!: Hierarchical[];
}
