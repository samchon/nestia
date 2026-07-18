"use client";

import { ReactNode } from "react";

/**
 * The landing's outermost wrapper.
 *
 * The `nestia-landing` class is what global.css keys the full-bleed rules
 * off: it widens the content column to 100% and drops the TOC along with
 * Nextra's 256px sidebar spacer. Before that existed this component faked
 * the same effect with `margin: 0 -15rem` above `lg`, which overflowed at
 * in-between widths and left the sections off-center.
 */
const HomeLayout = (props: { children: ReactNode }) => (
  <div className="nestia-landing" style={{ maxWidth: "100%" }}>
    {props.children}
  </div>
);
export default HomeLayout;
