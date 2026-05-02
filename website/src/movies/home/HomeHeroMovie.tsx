"use client";

import ComputerIcon from "@mui/icons-material/Computer";
import GitHubIcon from "@mui/icons-material/GitHub";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Box, Button, Container, Typography } from "@mui/material";
import { ReactNode } from "react";

const BLUE = "rgb(0, 200, 255)";
const CYAN = "rgb(80, 200, 0)";
const PURPLE = "rgb(191, 64, 191)";

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
      borderColor:
        props.variant === "outlined" ? "rgba(255,255,255,0.3)" : undefined,
      color:
        props.variant === "outlined" ? "rgba(255,255,255,0.9)" : undefined,
      "&:hover": {
        borderColor:
          props.variant === "outlined" ? "rgba(255,255,255,0.6)" : undefined,
        backgroundColor:
          props.variant === "outlined" ? "rgba(255,255,255,0.05)" : undefined,
      },
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
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Radial gradient background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,150,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          component="img"
          src="/favicon/android-chrome-512x512.png"
          alt="Nestia"
          sx={{
            display: "block",
            mx: "auto",
            mb: 3,
            width: { xs: 120, md: 160 },
            height: { xs: 120, md: 160 },
          }}
        />
        <Typography
          variant="h5"
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            fontSize: { xs: "1rem", sm: "1.15rem", md: "1.3rem" },
            lineHeight: 1.7,
            maxWidth: 700,
            mx: "auto",
            mb: 2,
          }}
        >
          Supercharge your NestJS backend with
          <br />
          <strong style={{ color: "rgba(255,255,255,0.95)" }}>
            20,000x faster
          </strong>{" "}
          validation, type-safe SDK, and AI integration
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "1rem",
            mb: 3,
          }}
        >
          No extra schema required. Just fine with pure TypeScript type.
        </Typography>
        <Typography
          sx={{
            fontFamily:
              "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            fontSize: { xs: "0.9rem", md: "1.1rem" },
            mb: 5,
          }}
        >
          <span style={{ color: PURPLE }}>@</span>
          <span style={{ color: BLUE }}>TypedBody</span>
          <span style={{ color: "gray" }}>{"() "}</span>
          <span style={{ color: "gray" }}>{"input: "}</span>
          <span style={{ color: CYAN }}>IArticleCreate</span>
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
            title="Guide Documents"
            icon={<MenuBookIcon />}
            href="/docs"
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
