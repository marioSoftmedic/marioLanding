# Content Hubs — mariohealthbits.dev

## Objetivo

Los hubs reemplazan la sección automática de noticias como señal SEO. No son páginas manuales que haya que actualizar post por post: se alimentan desde los tags canónicos de cada MDX.

## Hubs activos

| Hub                        | URL ES                   | URL EN                     | Tags que alimentan el hub                                                                                                           |
| -------------------------- | ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Salud Digital en Chile     | `/salud-digital-chile`   | `/en/digital-health-chile` | `digital-health`, `interoperability`, `fhir`, `hl7`, `ley-21668`, `fonasa`, `clinical-labs`, `medical`, `healthcare`                |
| Agentes IA en Producción   | `/agentes-ia-produccion` | `/en/ai-agents-production` | `ai`, `agents`, `multi-agent`, `mcp`, `testing`, `production`, `evaluation`, `architecture`, `automation`, `opencode`               |
| Examya                     | `/examya`                | `/en/examya`               | `examya`, `whatsapp`, `ocr`, `fonasa`, `digital-health`, `medical`, `architecture`, `production`                                    |
| Builder desde la Patagonia | `/builder-patagonia`     | `/en/patagonia-builder`    | `patagonia`, `story`, `biohealth`, `huillin`, `cotocha`, `entrepreneurship`, `automation`, `engram`, `pkm`, `sync`, `memory`, `vps` |

La fuente de verdad está en `src/lib/hubs.ts`.

## Flujo diario para nuevos posts

1. Crear el draft con la skill `astro-blog-post`.
2. Aplicar `seo-blog-2026` antes de cerrar el frontmatter:
   - keyword principal,
   - meta description factual,
   - 2-4 links internos,
   - señales E-E-A-T si toca salud.
3. Elegir tags desde `src/lib/tags.ts`, no inventar tags nuevos.
4. Verificar que al menos un tag del post pertenezca a un hub de `src/lib/hubs.ts`.
5. Ejecutar `npm run validate-posts` antes de publicar.
6. Publicar ES + EN cuando corresponda. Los posts EN deben incluir `canonicalSlug`.

## Cuándo crear un hub nuevo

Crear un hub solo si hay o habrá al menos 5 posts sobre el tema. Si no, usar tags normales.

Buenos candidatos futuros:

- `FHIR Chile para builders`
- `WhatsApp Bots para clínicas y laboratorios`
- `Testing de agentes IA`
- `Automatización desde Obsidian/Engram/Cotocha`

## Regla editorial

Cada hub debe responder una intención de búsqueda, no una categoría interna. Ejemplo bueno: “Agentes IA en Producción”. Ejemplo débil: “Mis notas de IA”.
