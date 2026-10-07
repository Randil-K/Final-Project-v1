# Third-party credits

## Photographs

### `frontend/public/assets/sea-jellyfish.jpg`

Jellyfish drifting in dark water. Shown on the sign-in and registration pages.

- **Title:** Jellyfish swimming
- **Photographer:** Daniel Codina (L'Oceanogràfic, Valencia)
- **Source:** [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jellyfish_swimming_(Unsplash).jpg), originally from Unsplash
- **Licence:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — public domain dedication
- **Changes:** downscaled to 1920 x 1272 for the web. Not otherwise altered.
- **Why this one:** the picture panel is tall and narrow, so a photograph with a single
  centred subject (a turtle, say) loses its edges to the crop. Jellyfish are spread across the
  frame, so the image reads properly at any panel shape, and the near-black water matches the
  `--sea-950` background the rest of the app uses.

CC0 waives all copyright, so **no attribution is required and no credit line appears on the
page**. This entry exists only to record where the file came from, so a future reader can verify
it is free to use. A photo under CC BY or CC BY-SA would need a visible credit instead — that is
why this one was chosen.

Everything else in the interface is drawn in-house as inline SVG (see `pages/Landing.jsx`).

## Icons

`frontend/public/assets/icons/` are [Lucide](https://lucide.dev/) icons, ISC licensed.
`eye-off.svg` was drawn locally to match the set, from the existing `eye.svg` plus a slash.
