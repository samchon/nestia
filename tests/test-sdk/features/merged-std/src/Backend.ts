import core from "@nestia/core";
import { INestApplication, Module } from "@nestjs/common";
import { NestFactory, RouterModule } from "@nestjs/core";

import { BbsArticleController as F0_BbsArticleController } from "./features/array/controllers/BbsArticleController";
import { GoogleDriveImageUploadController as F1_GoogleDriveImageUploadController } from "./features/body-generic-default/controllers/GoogleDriveImageUploadController";
import { TypedBodyController as F1_TypedBodyController } from "./features/body-generic-default/controllers/TypedBodyController";
import { HealthController as F2_HealthController } from "./features/body-manual-assert/controllers/HealthController";
import { PerformanceController as F2_PerformanceController } from "./features/body-manual-assert/controllers/PerformanceController";
import { TypedBodyController as F2_TypedBodyController } from "./features/body-manual-assert/controllers/TypedBodyController";
import { HealthController as F3_HealthController } from "./features/body-manual-is/controllers/HealthController";
import { PerformanceController as F3_PerformanceController } from "./features/body-manual-is/controllers/PerformanceController";
import { TypedBodyController as F3_TypedBodyController } from "./features/body-manual-is/controllers/TypedBodyController";
import { HealthController as F4_HealthController } from "./features/body-manual-validate/controllers/HealthController";
import { PerformanceController as F4_PerformanceController } from "./features/body-manual-validate/controllers/PerformanceController";
import { TypedBodyController as F4_TypedBodyController } from "./features/body-manual-validate/controllers/TypedBodyController";
import { HealthController as F5_HealthController } from "./features/config-pattern/routes/health/health.controller";
import { PerformanceController as F5_PerformanceController } from "./features/config-pattern/routes/performance/performance.controller";
import { DateController as F6_DateController } from "./features/date/controllers/DateController";
import { HealthController as F6_HealthController } from "./features/date/controllers/HealthController";
import { PerformanceController as F6_PerformanceController } from "./features/date/controllers/PerformanceController";
import { DuplicatedController as F7_DuplicatedController } from "./features/duplicated/controllers/DuplicatedController";
import { HealthController as F7_HealthController } from "./features/duplicated/controllers/HealthController";
import { PerformanceController as F7_PerformanceController } from "./features/duplicated/controllers/PerformanceController";
import { DeleteController as F8_DeleteController } from "./features/escape/controllers/DeleteController";
import { UserController as F8_UserController } from "./features/escape/controllers/UserController";
import { BbsArticleController as F9_BbsArticleController } from "./features/import-type/controllers/BbsArticleController";
import { HealthController as F10_HealthController } from "./features/kebab/controllers/HealthController";
import { KebabController as F10_KebabController } from "./features/kebab/controllers/KebabController";
import { PerformanceController as F10_PerformanceController } from "./features/kebab/controllers/PerformanceController";
import { HealthController as F11_HealthController } from "./features/non-equals/controllers/HealthController";
import { PerformanceController as F11_PerformanceController } from "./features/non-equals/controllers/PerformanceController";
import { RequestController as F11_RequestController } from "./features/non-equals/controllers/RequestController";
import { HealthController as F12_HealthController } from "./features/operationId/controllers/HealthController";
import { OperationIdController as F12_OperationIdController } from "./features/operationId/controllers/OperationIdController";
import { PerformanceController as F12_PerformanceController } from "./features/operationId/controllers/PerformanceController";
import { HealthController as F13_HealthController } from "./features/route-manual-assert/controllers/HealthController";
import { PerformanceController as F13_PerformanceController } from "./features/route-manual-assert/controllers/PerformanceController";
import { TypedRouteController as F13_TypedRouteController } from "./features/route-manual-assert/controllers/TypedRouteController";
import { HealthController as F14_HealthController } from "./features/route-manual-is/controllers/HealthController";
import { PerformanceController as F14_PerformanceController } from "./features/route-manual-is/controllers/PerformanceController";
import { TypedRouteController as F14_TypedRouteController } from "./features/route-manual-is/controllers/TypedRouteController";
import { HealthController as F15_HealthController } from "./features/route-manual-stringify/controllers/HealthController";
import { PerformanceController as F15_PerformanceController } from "./features/route-manual-stringify/controllers/PerformanceController";
import { ManualRouteController as F15_ManualRouteController } from "./features/route-manual-stringify/controllers/TypedRouteController";
import { HealthController as F16_HealthController } from "./features/route-manual-validate/controllers/HealthController";
import { PerformanceController as F16_PerformanceController } from "./features/route-manual-validate/controllers/PerformanceController";
import { ManualRouteController as F16_ManualRouteController } from "./features/route-manual-validate/controllers/TypedRouteController";
import { BbsPackageArticlesController as F17_BbsPackageArticlesController } from "./features/variable/controllers/BbsPackageArticlesController";
import { HealthController as F17_HealthController } from "./features/variable/controllers/HealthController";
import { PerformanceController as F17_PerformanceController } from "./features/variable/controllers/PerformanceController";

const PASSWORD = { key: "A".repeat(32), iv: "B".repeat(16) };

@core.EncryptedModule(
  { controllers: [F0_BbsArticleController] },
  () => PASSWORD,
)
class M0 {}

@core.EncryptedModule(
  {
    controllers: [F1_GoogleDriveImageUploadController, F1_TypedBodyController],
  },
  () => PASSWORD,
)
class M1 {}

@core.EncryptedModule(
  {
    controllers: [
      F2_HealthController,
      F2_PerformanceController,
      F2_TypedBodyController,
    ],
  },
  () => PASSWORD,
)
class M2 {}

@core.EncryptedModule(
  {
    controllers: [
      F3_HealthController,
      F3_PerformanceController,
      F3_TypedBodyController,
    ],
  },
  () => PASSWORD,
)
class M3 {}

@core.EncryptedModule(
  {
    controllers: [
      F4_HealthController,
      F4_PerformanceController,
      F4_TypedBodyController,
    ],
  },
  () => PASSWORD,
)
class M4 {}

@core.EncryptedModule(
  { controllers: [F5_HealthController, F5_PerformanceController] },
  () => PASSWORD,
)
class M5 {}

@core.EncryptedModule(
  {
    controllers: [
      F6_DateController,
      F6_HealthController,
      F6_PerformanceController,
    ],
  },
  () => PASSWORD,
)
class M6 {}

@core.EncryptedModule(
  {
    controllers: [
      F7_DuplicatedController,
      F7_HealthController,
      F7_PerformanceController,
    ],
  },
  () => PASSWORD,
)
class M7 {}

@core.EncryptedModule(
  { controllers: [F8_DeleteController, F8_UserController] },
  () => PASSWORD,
)
class M8 {}

@core.EncryptedModule(
  { controllers: [F9_BbsArticleController] },
  () => PASSWORD,
)
class M9 {}

@core.EncryptedModule(
  {
    controllers: [
      F10_HealthController,
      F10_KebabController,
      F10_PerformanceController,
    ],
  },
  () => PASSWORD,
)
class M10 {}

@core.EncryptedModule(
  {
    controllers: [
      F11_HealthController,
      F11_PerformanceController,
      F11_RequestController,
    ],
  },
  () => PASSWORD,
)
class M11 {}

@core.EncryptedModule(
  {
    controllers: [
      F12_HealthController,
      F12_OperationIdController,
      F12_PerformanceController,
    ],
  },
  () => PASSWORD,
)
class M12 {}

@core.EncryptedModule(
  {
    controllers: [
      F13_HealthController,
      F13_PerformanceController,
      F13_TypedRouteController,
    ],
  },
  () => PASSWORD,
)
class M13 {}

@core.EncryptedModule(
  {
    controllers: [
      F14_HealthController,
      F14_PerformanceController,
      F14_TypedRouteController,
    ],
  },
  () => PASSWORD,
)
class M14 {}

@core.EncryptedModule(
  {
    controllers: [
      F15_HealthController,
      F15_PerformanceController,
      F15_ManualRouteController,
    ],
  },
  () => PASSWORD,
)
class M15 {}

@core.EncryptedModule(
  {
    controllers: [
      F16_HealthController,
      F16_PerformanceController,
      F16_ManualRouteController,
    ],
  },
  () => PASSWORD,
)
class M16 {}

@core.EncryptedModule(
  {
    controllers: [
      F17_BbsPackageArticlesController,
      F17_HealthController,
      F17_PerformanceController,
    ],
  },
  () => PASSWORD,
)
class M17 {}

const ROUTES = [
  { path: "array", module: M0 },
  { path: "body-generic-default", module: M1 },
  { path: "body-manual-assert", module: M2 },
  { path: "body-manual-is", module: M3 },
  { path: "body-manual-validate", module: M4 },
  { path: "config-pattern", module: M5 },
  { path: "date", module: M6 },
  { path: "duplicated", module: M7 },
  { path: "escape", module: M8 },
  { path: "import-type", module: M9 },
  { path: "kebab", module: M10 },
  { path: "non-equals", module: M11 },
  { path: "operationId", module: M12 },
  { path: "route-manual-assert", module: M13 },
  { path: "route-manual-is", module: M14 },
  { path: "route-manual-stringify", module: M15 },
  { path: "route-manual-validate", module: M16 },
  { path: "variable", module: M17 },
];

@Module({
  imports: [...ROUTES.map((r) => r.module), RouterModule.register(ROUTES)],
})
class MergedModule {}

/** Every merged feature's controllers, each mounted at its feature's name. */
export class Backend {
  private application_?: INestApplication;

  public static async create(): Promise<INestApplication> {
    const app: INestApplication = await NestFactory.create(MergedModule, {
      logger: false,
    });
    await core.WebSocketAdaptor.upgrade(app);
    return app;
  }

  public async open(): Promise<void> {
    this.application_ = await Backend.create();
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
