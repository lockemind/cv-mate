# cv-mate

A personal CV/resume management system for keeping curriculum vitae data structured, versioned, and ready to generate tailored outputs for different clients and opportunities.

## Intent

Professionals working across multiple clients and projects face a recurring challenge: keeping a CV current and relevant. cv-mate solves this by separating the **source of truth** (your complete career data) from the **generated outputs** (tailored resumes for specific contexts).

The core idea:
- Maintain a single, rich data store of your full professional history
- Generate targeted CV versions — trimmed, reordered, or formatted — for each client or role
- Never lose detail by over-editing a "master" document

## Planned Structure

```
cv-mate/
├── data/               # Structured career data (YAML or JSON)
│   ├── profile.yaml    # Personal info, summary, contacts
│   ├── experience.yaml # Work history with full detail
│   ├── education.yaml  # Academic background
│   ├── skills.yaml     # Technical and soft skills
│   └── projects.yaml   # Notable projects (cross-referenced with experience)
├── templates/          # Output templates (Markdown, LaTeX, HTML)
├── profiles/           # Named CV variants (e.g., "backend-senior", "consulting")
├── output/             # Generated CV files (gitignored or versioned)
└── tools/              # Scripts/CLI to generate and render CVs
```

## Workflow

1. **Add data** — update YAML files under `data/` whenever you finish a project, change roles, or learn a new skill
2. **Define a profile** — create a profile in `profiles/` that selects and prioritizes the data relevant to a specific client or role type
3. **Generate** — run the tooling to render a CV from a profile + template into PDF, DOCX, or Markdown

## Next Steps

See the [Next Steps](#next-steps-guide) section below for a suggested implementation path.

---

## Next Steps Guide

### Step 1 — Define the data schema
Decide on the structure for your YAML/JSON data files. Start with `data/profile.yaml` and `data/experience.yaml`. The richer the data you put in now, the more flexible your generation becomes.

### Step 2 — Seed your data
Populate the data files with your actual career history. Be thorough — include projects, technologies, and context you might normally leave out. You can always filter at generation time.

### Step 3 — Choose a template format
Pick what format you need as output:
- **Markdown** — simplest, readable anywhere, easy to paste
- **HTML/CSS** — full design control, printable to PDF via browser
- **LaTeX** — professional typesetting, common in academic/engineering CVs
- **DOCX** — for clients who require Word format

### Step 4 — Build the generation tooling
A simple script (Python or Node) that reads your data + a profile config and renders it through a template. This can start as a single script and grow into a small CLI.

### Step 5 — Define client profiles
For each recurring client type or engagement, create a profile that specifies which experiences to include, which skills to highlight, and any custom summary text.

### Step 6 — Automate PDF export
Wire the HTML or LaTeX template into a headless export so you can generate a print-ready PDF with one command.
