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
      className="nextra-focus _text-primary-600 _underline hover:_no-underline _decoration-from-font [text-underline-position:from-font]"
    >
      {props.children}
    </a>
  );
}
