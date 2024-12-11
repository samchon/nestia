import React from "react";

export function List({ children }: React.PropsWithChildren) {
  return (
    <ul className="[:is(ol,ul)_&]:_my-3 [&:not(:first-child)]:_mt-6 _list-disc ltr:_ml-6 rtl:_mr-6">
      {children}
    </ul>
  );
}
