export interface IGoogleTokenActivate<
  Value extends string,
  Scopes extends never | string[] = string[],
> {
  value: Value;
  scopes: Scopes;
}
