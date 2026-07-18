"use client";

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

import { PALETTE } from "../../constants/PALETTE";

/**
 * The title/subtitle pair every landing section opens with.
 *
 * All five sections below the hero had this markup copied verbatim, which is
 * how they ended up drifting onto five separate hardcoded text colors.
 */
const HomeSectionHeading = (props: {
  title: string;
  children: ReactNode;
  maxWidth?: number;
}) => (
  <Box sx={{ textAlign: "center", mb: 6 }}>
    <Typography
      variant="h3"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "1.6rem", md: "2.2rem" },
        mb: 2,
        color: PALETTE.INK,
      }}
    >
      {props.title}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        color: PALETTE.MUTED,
        fontSize: "1.05rem",
        maxWidth: props.maxWidth ?? 650,
        mx: "auto",
      }}
    >
      {props.children}
    </Typography>
  </Box>
);
export default HomeSectionHeading;
