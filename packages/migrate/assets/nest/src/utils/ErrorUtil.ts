import serializeError = require("serialize-error");

export namespace ErrorUtil {
  export const toJSON = (err: any): object =>
    err instanceof Object && err.toJSON instanceof Function
      ? err.toJSON()
      : serializeError(err);
}
