import { INestApplication } from "@nestjs/common";

import { IReflectController } from "./IReflectController";

export interface IReflectApplication {
  application: INestApplication;
  controllers: IReflectController[];
}
