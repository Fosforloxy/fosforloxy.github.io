# finnmulligan.com — specimen catalog

Static site. No build step, no dependencies. Open `index.html` in a browser to preview.

## Getting it live (about 15 minutes)

1. Create a GitHub repo named `finnmulligan.github.io` (use your actual username).
2. Push everything in this folder to the `main` branch.
3. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save.
4. Live in a couple of minutes at `https://<username>.github.io`.

### Custom domain (optional, ~$12/yr)
- Buy the domain (Namecheap, Porkbun, Cloudflare).
- Add a file named `CNAME` at the repo root containing one line: `finnmulligan.com`
- At your registrar, add four A records pointing to `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`, and a CNAME for `www` → `<username>.github.io`.
- Settings → Pages → Custom domain → enter it → tick "Enforce HTTPS".

## What to fill in

Search the project for `REPLACE` — that's everything waiting on you.

| Where | What |
|---|---|
| `index.html` | GitHub + LinkedIn URLs in the masthead; project descriptions |
| `borgle/`, `automata/`, `squigs/`, `sketches/` | Drop each project's own files in, replacing the placeholder `index.html` |
| `writing/healthcare-essay.pdf` | Add the PDF; fill in title and summary |
| `terrarium/photos/01.jpg` … | Add photos; write captions. Resize to ~1600px wide first |

Resizing photos, if you have ImageMagick:
```
mogrify -resize 1600x -quality 82 terrarium/photos/*.jpg
```

## Adding a project later

Copy any card block in `index.html`, change the `href`, `kind`, title, description, and year.
The `kind` label is the taxonomy — keep it to a short word (Playable, Interactive, Sketchbook,
Photographs, Writing) so the grid stays legible.

## Reskinning

Every color and typeface is a CSS variable at the top of `style.css`. Change them there
and the whole site follows.
