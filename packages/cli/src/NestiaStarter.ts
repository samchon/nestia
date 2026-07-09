import { NestiaProjectTemplate } from "./NestiaProjectTemplate.js";

export namespace NestiaStarter {
  export const clone = NestiaProjectTemplate.clone({
    title: "Nestia Starter Kit",
    repository: "https://github.com/samchon/nestia-start",
    test: true,
  });
}
