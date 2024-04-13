import * as tr from "class-transformer";
import * as cv from "class-validator";
import "reflect-metadata";

import { ClassValidatorTimestamp } from "./ClassValidatorTimestamp";

class Channel {
  @cv.IsNumber()
  public id!: number;

  @cv.IsString()
  public code!: string;

  @cv.IsString()
  public name!: string;

  @cv.IsNumber()
  public sequence!: number;

  @cv.IsBoolean()
  public exclusive!: boolean;

  @cv.IsNumber()
  public priority!: number;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  public created_at!: ClassValidatorTimestamp;
}

class Account {
  @cv.IsNumber()
  public id!: number;

  @cv.IsString()
  public code!: string;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  public created_at!: ClassValidatorTimestamp;
}

class Member {
  @cv.IsNumber()
  public id!: number;

  @tr.Type(() => Account)
  @cv.IsObject()
  @cv.ValidateNested()
  public account!: Account;

  @tr.Type(() => Enterprise)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  public enterprise!: Enterprise | null;

  @cv.IsArray()
  @cv.IsString({ each: true })
  public emails!: string[];

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  public created_at!: ClassValidatorTimestamp;

  @cv.IsBoolean()
  public authorized!: boolean;
}

class Enterprise {
  @cv.IsNumber()
  public id!: number;

  @tr.Type(() => Account)
  @cv.IsObject()
  @cv.ValidateNested()
  public account!: Account;

  @cv.IsString()
  public name!: string;

  @cv.IsNumber()
  public grade!: number;

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  public created_at!: ClassValidatorTimestamp;
}

class Hierarchical {
  @cv.IsNumber()
  public id!: number;

  @tr.Type(() => Channel)
  @cv.IsObject()
  @cv.ValidateNested()
  public channel!: Channel;

  @tr.Type(() => Member)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  public member!: Member | null;

  @tr.Type(() => Account)
  @cv.IsOptional()
  @cv.IsObject()
  @cv.ValidateNested()
  public account!: Account | null;

  @cv.IsString()
  public href!: string;

  @cv.IsString()
  public referrer!: string;

  @cv.IsArray()
  @cv.IsNumber({}, { each: true })
  public ip!: [number, number, number, number];

  @tr.Type(() => ClassValidatorTimestamp)
  @cv.IsObject()
  @cv.ValidateNested()
  public created_at!: ClassValidatorTimestamp;
}

export class ClassValidatorObjectHierarchical {
  @tr.Type(() => Hierarchical)
  @cv.IsArray()
  @cv.IsObject({ each: true })
  @cv.ValidateNested({ each: true })
  public data!: Hierarchical[];
}
