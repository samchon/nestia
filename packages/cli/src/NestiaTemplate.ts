import { NestiaProjectTemplate } from "./NestiaProjectTemplate.js";

export namespace NestiaTemplate {
  export const clone = NestiaProjectTemplate.clone({
    title: "Nestia Template Kit",
    repository: "https://github.com/samchon/backend",
    test: false,
  });
}
