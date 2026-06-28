# Immersive ("dream") prompts — render → walkable / 360

Templates to turn each room's **colored-pencil** render into an immersive asset.

**Rule 1:** feed the **colored-pencil illustration** (not the photoreal render) as the source/style image — that's what carries the hand-drawn house style into 3D. The photoreal can ride along as a layout reference.

**Rule 2:** keep the **style block** identical across every room; swap only the room description. Test the Great Room first; if the style holds, template the rest.

---

## Style block (reuse verbatim for every room)
> hand-drawn colored-pencil architectural illustration — soft layered colored-pencil strokes, visible cream paper grain, gentle cross-hatching, muted naturalistic palette, soft diffuse daylight, delicate linework on architectural edges, warm, intimate, artisanal; not photographic, not a 3D render

## Negative prompt (Skybox; Marble has no negative field)
> photorealistic, photograph, CGI, 3D render, harsh shadows, hard contrast, text, watermark, signage, people, fisheye distortion, warped lines, blurry

---

## MARBLE (World Labs) — image → walkable world
Upload the **colored-pencil** Great Room render as the source image. Paste this as the text guidance:

> A warm, double-height Texas Hill Country great room, [STYLE BLOCK]. A central floor-to-ceiling cream limestone fireplace with an arched firebox, herringbone brick interior, and a lit fire; a limestone mantel holding framed black-and-white family photographs and a small clock; a large framed black-and-white photograph above. Dark espresso-wood bookshelves of books, vinyl records, and framed photos flank the fireplace. A deep navy linen sofa with a cream knit throw at left; a cognac leather armchair at right; a low walnut coffee table strewn with Lego and a board game; a red patterned Persian rug on a pale limestone floor. Tall multi-pane windows on both side walls look out to bare early-spring live oaks. Exposed dark timber ceiling beams overhead. Render the whole space in one consistent colored-pencil style, consistent lighting and palette, as a single continuous interior to walk through. Bias strongly toward preserving the source image's style.

Export: Gaussian splat or mesh → hand to Code for in-app integration.

---

## SKYBOX AI (Blockade Labs) — text → 360° panorama
Style: **Advanced / custom style** — paste the style block as the style words (or pick "Digital Painting"). If the image/remix input is available, use the colored-pencil render as the style reference. Generate at max resolution; export the **equirectangular PNG**.

> 360° equirectangular interior panorama of a double-height Texas Hill Country great room, [STYLE BLOCK]. On one wall, a floor-to-ceiling cream limestone fireplace with an arched firebox, herringbone brick interior, and a lit fire; a limestone mantel with framed black-and-white family photos; a large framed photograph above; dark espresso bookshelves of books, records, and photos flanking it. Around the rest of the room: a deep navy linen sofa with a cream throw, a cognac leather armchair, a low walnut coffee table covered in Lego and a board game, a red patterned Persian rug on a pale limestone floor. Tall multi-pane windows on the side walls look out to bare early-spring live oaks under a soft sky. Exposed dark timber ceiling beams overhead. Seamless, cohesive colored-pencil illustration in every direction.

Export: equirectangular PNG → hand to Code; it wraps onto a sphere for "look around inside."

---

## Per-room template
Replace the bracketed description; keep the style block and structure:

> [MARBLE] A [room name] in the Hill Country compound, [STYLE BLOCK]. [2–4 sentences of the room's contents, materials, light, and what's out each window]. One continuous interior to walk through; preserve the source image's style.

Source the room description from `src/data/legacy_content.json` (the `intent` + `specs` per room) and the room's render.
