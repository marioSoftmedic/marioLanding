# claude-skills

Skills compartidas entre el Cowork (Mac, Mario) y Cotocha (VPS Linux).

## Skills disponibles

- `architecture-diagram/` — diagramas dark-themed con SVG. Ver `architecture-diagram/SKILL.md`.

## Instalación (VPS / Cotocha)

```bash
cd ~/repos/marioLanding_blog
git pull
ln -sfn "$(pwd)/tools/claude-skills/architecture-diagram" ~/.claude/skills/architecture-diagram
```

Con `git pull` en el repo del blog ya tenés cualquier update de skill. El symlink evita duplicar archivos.

## Rasterización SVG → PNG según plataforma

La skill `architecture-diagram` asume macOS (`qlmanage`). En Linux usá una de estas:

```bash
# A) librsvg (suele estar en Ubuntu por default)
rsvg-convert -w 1600 input.svg -o output.png

# B) cairosvg (Python, si librsvg no está)
pip install cairosvg --break-system-packages
python3 -c "import cairosvg; cairosvg.svg2png(url='input.svg', write_to='output.png', output_width=1600)"
```
