import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

const bootstrap = async (): Promise<void> => {
  const app: INestApplication = await NestFactory.create(ApplicationModule);
  const document = await NestiaSwaggerComposer.document(app, {});
  SwaggerModule.setup("api", app, document as any);
  await app.listen(37_000);
};
bootstrap().catch(console.error);

class ApplicationModule {}
