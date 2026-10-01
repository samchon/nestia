import core from "@nestia/core";
import { HttpException } from "@nestjs/common";

export class DomainError extends Error {}
export class OtherError extends Error {}
export class NotFoundError extends DomainError {}
export class GoneError extends NotFoundError {}

/**
 * Registers the converters in an order that puts an unrelated class between a
 * superclass and its subclass, which the insertion must still order.
 */
export const registerDomainErrors = (): void => {
  core.ExceptionManager.insert(
    DomainError,
    () => new HttpException("domain", 400),
  );
  core.ExceptionManager.insert(
    OtherError,
    () => new HttpException("other", 409),
  );
  core.ExceptionManager.insert(
    NotFoundError,
    () => new HttpException("not found", 404),
  );
  core.ExceptionManager.insert(GoneError, () => new HttpException("gone", 410));
};
