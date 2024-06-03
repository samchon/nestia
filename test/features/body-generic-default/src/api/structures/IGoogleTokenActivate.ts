import { SecretKey } from "./SecretKey";

export interface IGoogleTokenActivate<
  Value extends string,
  Scopes extends never | string[] = never,
> {
  token: string & SecretKey<Value, Scopes>;
}
