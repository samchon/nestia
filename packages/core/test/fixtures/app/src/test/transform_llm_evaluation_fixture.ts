import typia from "typia";

export const evaluation = () =>
  typia.llm.evaluation<{
    /** Whether the reply answers the question. */
    answered: boolean;
  }>();
