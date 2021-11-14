import { z } from 'zod';

export type File = {
  name: string;
  extension: string;
  path: string;
};

export const ApiSuggestionSchema = z.array(
  z.object({
    ac: z.number(),
    an: z.string(),
    as: z.array(z.string()).nonempty(),
    b: z.number(),
    c: z.string(),
    cr: z.string().nullable(),
    d: z.number(),
    da: z.number(),
    e: z.number(),
    er: z.array(z.string()),
    h: z.number(),
    i: z.number(),
    id: z.string(),
    ie: z.boolean(),
    im: z.array(z.string()),
    is: z.boolean(),
    k: z.string(),
    kv: z.number(),
    l: z.string().nullable(),
    li: z.number(),
    lo: z.number(),
    n: z.string(),
    p: z.number(),
    r: z.array(z.string()),
    rd: z.string().nullable(),
    s: z.number(),
  })
);

export type ApiSuggestions = z.infer<typeof ApiSuggestionSchema>;

export const SuggestionSchema = z.object({
  id: z.string(),
  img: z.string(),
  artist: z.string(),
  title: z.string(),
  bpm: z.string(),
  camelot: z.string(),
  key: z.string(),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;
