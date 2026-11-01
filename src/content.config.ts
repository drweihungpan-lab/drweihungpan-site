// The single place Astro looks for content collections.
//
// Convention, so that tickets touching this file merge cleanly:
//   1. Define each collection in its own module under `src/collections/`.
//   2. Add one import line below, and one key to `collections`.
//   3. Keep both lists in alphabetical order.
//
// Every collection declares a Zod schema, so a malformed entry fails the
// build instead of rendering wrongly. See the spec's "Content model".
import { teaching } from './collections/teaching';

export const collections = { teaching };
