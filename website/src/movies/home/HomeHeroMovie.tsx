"use client";

import ComputerIcon from "@mui/icons-material/Computer";
import GitHubIcon from "@mui/icons-material/GitHub";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Box, Button, Container, Typography } from "@mui/material";
import { ReactNode } from "react";

import { PALETTE } from "../../constants/PALETTE";

const HeroButton = (props: {
  title: string;
  href: string;
  icon: ReactNode;
  variant: "contained" | "outlined";
  target?: string;
}) => (
  <Button
    variant={props.variant}
    size="large"
    component="a"
    href={props.href}
    target={props.target}
    rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
    startIcon={props.icon}
    sx={{
      fontWeight: 700,
      fontSize: "0.95rem",
      px: 3,
      py: 1.2,
      borderRadius: 2,
      textTransform: "none",
      // The primary CTA inverts to red-on-white rather than staying red: a
      // red button on the red band would have nothing separating it from its
      // own background.
      ...(props.variant === "contained"
        ? {
            backgroundColor: "#fff",
            color: PALETTE.RED_DEEP,
            "&:hover": { backgroundColor: PALETTE.WASH },
          }
        : {
            borderColor: "rgba(255,255,255,0.35)",
            color: "rgba(255,255,255,0.92)",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.65)",
              backgroundColor: "rgba(255,255,255,0.08)",
            },
          }),
    }}
  >
    {props.title}
  </Button>
);

const HomeHeroMovie = () => {
  return (
    <Box
      sx={{
        position: "relative",
        py: { xs: 8, md: 12 },
        px: 2,
        textAlign: "center",
        overflow: "hidden",
        background: PALETTE.BAND,
      }}
    >
      {/* Light bloom, lifting the center of the band away from flatness */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        {/* The mark is a colored PNG that muddies against red, so it keeps a
            white plate, the same treatment the navbar logo gets. */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
            p: { xs: 2, md: 2.5 },
            borderRadius: 4,
            backgroundColor: "#fff",
            boxShadow: "0 18px 40px rgba(31,20,23,0.28)",
          }}
        >
          <Box
            component="img"
            src="/favicon/android-chrome-512x512.png"
            alt="Nestia"
            sx={{
              display: "block",
              width: { xs: 96, md: 128 },
              height: { xs: 96, md: 128 },
            }}
          />
        </Box>
        <Typography
          variant="h5"
          sx={{
            color: "rgba(255,255,255,0.92)",
            fontWeight: 400,
            fontSize: { xs: "1rem", sm: "1.15rem", md: "1.3rem" },
            lineHeight: 1.7,
            maxWidth: 720,
            mx: "auto",
            mb: 2,
          }}
        >
          Stop writing DTOs three times. One TypeScript type drives a NestJS
          endpoint,
          <br />a <strong style={{ color: "#fff" }}>typed client SDK</strong>,
          an OpenAPI document, and e2e tests — for free.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "1rem",
            mb: 3,
          }}
        >
          No `class-validator`. No `@ApiProperty`. No codegen round-trip.
        </Typography>
        <Typography
          sx={{
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            fontSize: { xs: "0.9rem", md: "1.1rem" },
            mb: 5,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)" }}>@</span>
          <span style={{ color: "#fff", fontWeight: 600 }}>TypedBody</span>
          <span>{"() "}</span>
          <span>{"input: "}</span>
          <span style={{ color: "#ffd9df", fontWeight: 600 }}>
            IArticleCreate
          </span>
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <HeroButton
            title="Start the Tutorial"
            icon={<MenuBookIcon />}
            href="/docs/tutorial"
            variant="contained"
          />
          <HeroButton
            title="Playground"
            icon={<ComputerIcon />}
            href="https://stackblitz.com/github/samchon/nestia-start?file=README.md&view=editor"
            variant="outlined"
            target="_blank"
          />
          <HeroButton
            title="GitHub"
            icon={<GitHubIcon />}
            href="https://github.com/samchon/nestia"
            variant="outlined"
            target="_blank"
          />
        </Box>
      </Container>
    </Box>
  );
};
export default HomeHeroMovie;
