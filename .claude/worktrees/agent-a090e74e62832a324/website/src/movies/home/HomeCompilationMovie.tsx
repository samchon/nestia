"use client";

import { Box, Container, Typography } from "@mui/material";

import HomeCodeHighlight from "../../components/home/HomeCodeHighlight";

const BEFORE_CODE = `import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/:section/articles")
export class BbsArticlesController {
  @TypedRoute.Post()
  async create(
    @TypedParam("section") section: string,
    @TypedBody() input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    // no extra schema, no decorator tricks
    // just pure TypeScript type
    return this.service.create(section, input);
  }
}`;

const AFTER_CODE = `import api from "@my/api";
import { IBbsArticle } from "@my/api/lib/structures/IBbsArticle";

// auto-generated SDK — fully type-safe
const connection: api.IConnection = {
  host: "http://localhost:3000",
};
const article: IBbsArticle =
  await api.functional.bbs.articles.create(
    connection,
    "general",
    {
      title: "Hello World",
      body: "My first article",
      thumbnail: "https://example.com/img.png",
    } satisfies IBbsArticle.ICreate,
  );`;

const CodePanel = (props: {
  title: string;
  label: string;
  labelColor: string;
  code: string;
}) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      borderRadius: 2,
      border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.3)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.3,
          borderRadius: 1,
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          backgroundColor: props.labelColor,
          color: "#fff",
        }}
      >
        {props.label}
      </Box>
      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}
      >
        {props.title}
      </Typography>
    </Box>
    <Box
      component="pre"
      sx={{
        p: 2.5,
        m: 0,
        overflow: "auto",
        fontSize: { xs: "0.72rem", md: "0.8rem" },
        lineHeight: 1.7,
        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
        color: "rgba(255,255,255,0.85)",
        "&::-webkit-scrollbar": { height: 6 },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 3,
        },
      }}
    >
      <code>
        <HomeCodeHighlight>{props.code}</HomeCodeHighlight>
      </code>
    </Box>
  </Box>
);

const HomeCompilationMovie = () => (
  <Box sx={{ py: { xs: 6, md: 10 } }}>
    <Container maxWidth="lg">
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.6rem", md: "2.2rem" },
            mb: 2,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          SDK Generation Magic
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "1.05rem",
            maxWidth: 650,
            mx: "auto",
          }}
        >
          Write NestJS controllers as you normally would. Nestia analyzes your
          TypeScript types and generates a fully type-safe SDK — like tRPC,
          but fully automated.
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
        }}
      >
        <CodePanel
          title="Your NestJS Controller"
          label="Backend"
          labelColor="rgba(0,150,255,0.7)"
          code={BEFORE_CODE}
        />
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "2rem",
            px: 1,
          }}
        >
          →
        </Box>
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            justifyContent: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "2rem",
          }}
        >
          ↓
        </Box>
        <CodePanel
          title="Auto-generated SDK"
          label="Frontend"
          labelColor="rgba(80,200,0,0.7)"
          code={AFTER_CODE}
        />
      </Box>
    </Container>
  </Box>
);
export default HomeCompilationMovie;
