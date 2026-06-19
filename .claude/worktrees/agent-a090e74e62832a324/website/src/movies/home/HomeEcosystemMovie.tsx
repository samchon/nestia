"use client";

import { Box, Container, Grid, Typography } from "@mui/material";

const ComparisonColumn = (props: {
  label: string;
  labelColor: string;
  items: { icon: string; text: string }[];
  borderColor: string;
}) => (
  <Grid item xs={12} md={6}>
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${props.borderColor}`,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 1.5,
          backgroundColor: `${props.borderColor}15`,
          borderBottom: `1px solid ${props.borderColor}`,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: props.labelColor,
            fontSize: "0.95rem",
          }}
        >
          {props.label}
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        {props.items.map((item, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              mb: i < props.items.length - 1 ? 2.5 : 0,
            }}
          >
            <Typography sx={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
              {item.icon}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
                fontSize: "0.9rem",
              }}
            >
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </Grid>
);

const HomeEcosystemMovie = () => (
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
          Why Nestia?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "1.05rem",
            maxWidth: 700,
            mx: "auto",
          }}
        >
          Traditional NestJS development requires separate schemas, manual SDK
          writing, and verbose decorators. Nestia eliminates all of that with
          pure TypeScript types.
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <ComparisonColumn
          label="Traditional NestJS"
          labelColor="rgba(255,100,100,0.9)"
          borderColor="rgba(255,100,100,0.25)"
          items={[
            {
              icon: "✕",
              text: "Define class-validator decorators on every DTO property — verbose and error-prone",
            },
            {
              icon: "✕",
              text: "Write Swagger decorators manually (@ApiProperty, @ApiResponse) for documentation",
            },
            {
              icon: "✕",
              text: "Generate SDK with Swagger codegen — untyped, unreliable, and hard to maintain",
            },
            {
              icon: "✕",
              text: "No mockup simulator — frontend team must wait for backend implementation",
            },
            {
              icon: "✕",
              text: "Manual integration needed for AI/LLM function calling with your API",
            },
          ]}
        />
        <ComparisonColumn
          label="Nestia — Pure TypeScript"
          labelColor="rgba(0,200,100,0.9)"
          borderColor="rgba(0,200,100,0.25)"
          items={[
            {
              icon: "✓",
              text: "Write pure TypeScript interfaces — no decorators, no duplication, 20,000x faster validation",
            },
            {
              icon: "✓",
              text: "Swagger document auto-generated from TypeScript types — always in sync with code",
            },
            {
              icon: "✓",
              text: "Type-safe SDK auto-generated — like tRPC but requires zero code modification",
            },
            {
              icon: "✓",
              text: "Built-in mockup simulator in SDK — frontend can start development immediately",
            },
            {
              icon: "✓",
              text: "One-command AI chatbot — convert Swagger to LLM function calling schemas instantly",
            },
          ]}
        />
      </Grid>
    </Container>
  </Box>
);
export default HomeEcosystemMovie;
