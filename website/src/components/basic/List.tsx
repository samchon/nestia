import React from "react";

export function List({ children }: React.PropsWithChildren) {
  return (
    <ul className="x:[&:not(:first-child)]:mt-6 x:[&:is(ol,ul)_&]:my-3 x:list-disc x:ms-6">
      {children}
    </ul>
  );
}
