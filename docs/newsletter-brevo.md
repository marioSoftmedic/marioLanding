# Newsletter setup with Brevo Free

This site is wired for a zero-cost newsletter workflow using a custom Astro form that posts to Brevo.

## Decision: custom form, not iframe

Brevo provided three options:

1. A raw form action URL.
2. A full HTML embed with Brevo CSS and JavaScript.
3. An iframe embed.

For mariohealthbits.dev we use the **custom Astro form + Brevo POST action** because it matches the site's dark UI, typography, spacing and CTA system. The iframe works, but it brings Brevo's default light form and is harder to align with the site design.

The current default action is already wired in `src/components/NewsletterSignup.astro`:

```txt
https://92f7ef8b.sibforms.com/serve/MUIFAMRsCMDJd7_Dvzk6TWE7glb-9dyNcM_JCDZiETsrmKIZ75HvVFvTJ5uw2jcc3GqbZcy5N5Hwde2L7u_H011117rzTUPE_4vQcGEsr8RnEI5vZ0H8H8GEuPnD1M9rhUth-yV1jFLdmr0sONwxCOY90zBbmNbXPSl9uhqmVE1h_-FMzHq980hDcMEzz4OCk6R45Sq1575x4D8ftQ==
```

## Optional runtime variables

If Brevo rotates the form URL later, set this in Vercel instead of changing code:

```bash
PUBLIC_NEWSLETTER_FORM_ACTION="https://92f7ef8b.sibforms.com/serve/..."
```

Only use the iframe if the custom POST flow stops working:

```bash
PUBLIC_NEWSLETTER_EMBED_URL="https://92f7ef8b.sibforms.com/v2/serve/..."
```

When `PUBLIC_NEWSLETTER_EMBED_URL` is set, it takes precedence and renders the iframe.

## Brevo steps

1. Keep the contact list named `Healthbits Brief`.
2. Use this sender: `Mario Healthbits <newsletter@mariohealthbits.dev>`.
3. Keep `mariohealthbits.dev` authenticated in Brevo with SPF, DKIM and DMARC.
4. Keep the subscription form active in Brevo.
5. Test the site form after deploy with your own email.
6. Confirm the contact appears in Brevo.
7. Confirm the success/confirmation flow works and does not land in spam.

## Canonical weekly send flow

The weekly newsletter is a **short briefing**, not a long article.

Target:

- 600-1200 words in the editorial body. Around 900 words is the sweet spot.
- Premium B2B structure, not a plain link dump.
- Start with an executive thesis before article summaries.
- One decision per block, with a clear business implication for the lead.
- Fixed newsletter hero plus maximum one large blog diagram per edition.
- No daily sending.
- No automatic send without Mario's approval.

Generate the Obsidian-visible draft:

```bash
pnpm newsletter:digest
```

The script writes to the Obsidian vault by default:

```txt
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/newsletters/drafts/YYYY-MM-DD-healthbits-brief.md
```

Override the output path only for tests:

```bash
NEWSLETTER_DRAFTS_DIR=/tmp/newsletter-drafts pnpm newsletter:digest
```

Review process:

1. Open the generated draft in Obsidian.
2. Edit `Preview editorial para Obsidian` until the content is useful and readable.
3. Review `Email HTML para Brevo`, which should use buttons instead of visible long URLs.
4. Keep `approval: pending` while editing.
5. Validate draft structure while it is still pending:

   ```bash
   DRAFT="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/newsletters/drafts/YYYY-MM-DD-healthbits-brief.md"
   pnpm newsletter:validate --allow-pending "$DRAFT"
   ```

6. When Mario approves, change frontmatter to:

   ```yaml
   approval: approved
   ```

7. Render a visual preview for review:

   ```bash
   pnpm newsletter:preview "$DRAFT"
   ```

   This writes HTML/PDF/PNG preview files to:

   ```txt
   ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/newsletters/previews/
   ```

8. Run the pre-send gate. This must fail unless the draft is approved:

   ```bash
   pnpm newsletter:validate "$DRAFT"
   ```

9. Copy the approved `Email HTML para Brevo` content into a Brevo campaign.
10. Send or schedule from Brevo.
11. After sending, move the note from `newsletters/drafts/` to `newsletters/sent/` and update:

   ```yaml
   status: sent
   brevoCampaignId: "..."
   sentAt: YYYY-MM-DD
   ```

## Brevo vs n8n

Brevo is the sender of record.

Use Brevo for:

- subscriber list management;
- unsubscribe links;
- deliverability and domain reputation;
- campaign sending;
- open/click analytics.

Use n8n only as an orchestrator:

1. pull latest repo;
2. run `pnpm newsletter:digest`;
3. notify Mario with the Obsidian draft path;
4. wait for approval;
5. create a Brevo campaign through the Brevo API;
6. optionally schedule/send only after approval.

Do **not** send raw email from n8n. That hurts deliverability and bypasses Brevo's unsubscribe/reputation layer.

## Visual, PDF and resource policy

Default visual rule: use the fixed Healthbits Brief hero first, then at most one large blog visual/diagram as `Visual de la semana`. Reuse blog visuals/diagrams when they are already email-safe images (`.png`, `.jpg`, `.webp`). If the blog visual is HTML or SVG, export it to PNG/JPG before sending in Brevo.

Important: the fixed hero lives at `/img/newsletter/healthbits-brief-hero.png`, so the site must be deployed before sending a Brevo campaign that references it.

Default resource rule: **link PDFs/resources with buttons; do not attach them and do not show long URLs in the designed email**.

Why:

- better deliverability;
- lower email weight;
- click analytics in Brevo;
- the resource can be updated without resending the campaign;
- fewer spam signals for new sender reputation.

If a PDF is needed, publish it as a site resource or landing page and link it from the newsletter with a CTA button. Attachments are explicit exceptions only.

## Draft section policy

Recipient-facing sections:

- `Preview editorial para Obsidian` — human-readable preview for Mario.
- `Email HTML para Brevo` — copy/paste into Brevo.
- `Texto plano` — fallback.

Internal-only section:

- `Referencias internas — no copiar a Brevo` — tracking metadata for Mario/n8n only. Do not include it in the campaign body.

## Content metadata

New posts can declare conversion metadata:

```yaml
audience: "clinical-lab-directors"
funnelStage: "awareness"
primaryCta: "newsletter"
leadMagnet: "lis-whatsapp-guide"
newsletterTopic: "clinical-labs-as-api"
newsletterPriority: 3
```

The digest script prioritizes higher `newsletterPriority` posts.
