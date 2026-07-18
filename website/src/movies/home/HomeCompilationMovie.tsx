"use client";

import { Box, Container, Typography } from "@mui/material";

import HomeCodeHighlight from "../../components/home/HomeCodeHighlight";
import HomeSectionHeading from "../../components/home/HomeSectionHeading";
import { CODE, PALETTE } from "../../constants/PALETTE";

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

// The code panels stay on a dark surface even though the page is white: the
// syntax highlighter is pinned to `github-dark`, and re-tinting a whole theme
// to sit on white would fight it. A dark panel on white reads as a deliberate
// inset rather than a leftover from the old black site.
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
      border: `1px solid ${CODE.BORDER}`,
      overflow: "hidden",
      backgroundColor: CODE.SURFACE,
      boxShadow: "0 12px 30px rgba(31,20,23,0.14)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        borderBottom: `1px solid ${CODE.BORDER}`,
        backgroundColor: CODE.SURFACE_BAR,
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
      <Typography variant="body2" sx={{ color: CODE.DIM, fontWeight: 500 }}>
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
        color: CODE.TEXT,
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
      <HomeSectionHeading title="SDK Generation Magic">
        Write NestJS controllers as you normally would. Nestia analyzes your
        TypeScript types and generates a fully type-safe SDK — like tRPC, but
        fully automated.
      </HomeSectionHeading>
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
        }}
      >
        {/* Backend and frontend are told apart by red against ink, staying
            inside the two-tone rather than reaching for a third hue. */}
        <CodePanel
          title="Your NestJS Controller"
          label="Backend"
          labelColor={PALETTE.RED}
          code={BEFORE_CODE}
        />
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            color: PALETTE.RED,
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
            color: PALETTE.RED,
            fontSize: "2rem",
          }}
        >
          ↓
        </Box>
        <CodePanel
          title="Auto-generated SDK"
          label="Frontend"
          labelColor={PALETTE.INK}
          code={AFTER_CODE}
        />
      </Box>
    </Container>
  </Box>
);
export default HomeCompilationMovie;
