import React from "react";

export function HyperLink(
  props: React.PropsWithChildren<{
    href: string;
    target: React.HTMLAttributeAnchorTarget;
  }>,
) {
  return (
    <a
      href={props.href}
      target={props.target}
      className="x:focus-visible:nextra-focus x:text-primary-600 x:underline x:hover:no-underline x:decoration-from-font [text-underline-position:from-font]"
    >
      {props.children}
    </a>
  );
}
