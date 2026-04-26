// tokens/schema.mjs
// Zod schema for design-tokens.json.
// Note: authored as .mjs (not .ts) so generate.mjs can import it via bare node
// without a TS loader. Zod is plain ESM-compatible. A parallel schema.d.ts is
// not needed until a TS file imports the inferred type (deferred to T9+).

import { z } from "zod";

export const PaletteSchema = z
  .object({
    accent: z.object({
      gold: z.string(),
    }),
    bg: z.object({
      base: z.string(),
      surface: z.string(),
    }),
    danger: z.string(),
    fg: z.object({
      muted: z.string(),
      primary: z.string(),
    }),
    success: z.string(),
  })
  .strict();

export const TypeSchema = z
  .object({
    family: z
      .object({
        arabic: z.string(),
        mono: z.string(),
      })
      .strict(),
    scale: z
      .object({
        "2xl": z.string(),
        "3xl": z.string(),
        base: z.string(),
        lg: z.string(),
        md: z.string(),
        sm: z.string(),
        xl: z.string(),
        xxl: z.string(),
      })
      .strict(),
    weight: z
      .object({
        bold: z.string(),
        medium: z.string(),
        normal: z.string(),
        semibold: z.string(),
      })
      .strict(),
  })
  .strict();

export const SpacingSchema = z
  .object({
    "1": z.string(),
    "2": z.string(),
    "3": z.string(),
    "4": z.string(),
    "6": z.string(),
    "8": z.string(),
    "12": z.string(),
    "16": z.string(),
  })
  .strict();

export const RadiiSchema = z
  .object({
    lg: z.string(),
    md: z.string(),
    pill: z.string(),
    sm: z.string(),
    xl: z.string(),
  })
  .strict();

export const MotionSchema = z
  .object({
    duration: z
      .object({
        fast: z.string(),
        normal: z.string(),
        slow: z.string(),
      })
      .strict(),
    easing: z
      .object({
        default: z.string(),
      })
      .strict(),
  })
  .strict();

export const BreakpointsSchema = z
  .object({
    lg: z.string(),
    md: z.string(),
    sm: z.string(),
    wide: z.string(),
    xl: z.string(),
  })
  .strict();

/** Root schema — .strict() rejects unknown top-level keys */
export const TokensSchema = z
  .object({
    breakpoints: BreakpointsSchema,
    motion: MotionSchema,
    palette: PaletteSchema,
    radii: RadiiSchema,
    spacing: SpacingSchema,
    type: TypeSchema,
  })
  .strict();
