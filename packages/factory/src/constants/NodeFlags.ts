export const NodeFlags = {
  None: 0,
  Let: 1,
  Const: 2,
  NestedNamespace: 8,
  Synthesized: 16,
  Namespace: 32,
  OptionalChain: 64,
} as const;
