import { NoTransformConfigurationError } from "./NoTransformConfigurationError";

export const doNotThrowTransformError = (value: boolean = false) => {
  NoTransformConfigurationError.throws = value;
};
