export type Template = {
  prefix: `prefix_${string}`;
  postfix: `${string}_postfix`;
  middle_string: `the_${string}_value`;
  middle_string_empty: `the_${string}_value`;
  middle_numeric: `the_${number}_value`;
  middle_boolean: "the_false_value" | "the_true_value";
  ipv4: `${number}.${number}.${number}.${number}`;
  email: `${string}@${string}.${string}`;
  combined:
    | `the_1_value_with_label_A_${string}_${number}_4`
    | `the_2_value_with_label_A_${string}_${number}_4`
    | `the_3_value_with_label_A_${string}_${number}_4`;
  nosubstitution: "something";
};
