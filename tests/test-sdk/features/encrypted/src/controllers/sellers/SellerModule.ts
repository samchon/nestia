import { Module } from "@nestjs/common";

import { SellerAuthenticateController } from "./SellerAuthenticateController";

@Module({
  controllers: [SellerAuthenticateController],
})
export class SellerModule {}
