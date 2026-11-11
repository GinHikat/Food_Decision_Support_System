# Report: Restaurant Menu Decision Support System

This directory contains the formal XeLaTeX documentation for the **Restaurant Menu Decision Support System** group project (HUST - Decision Support System course).

Note: The report text in `main.tex` is written in **Vietnamese**, formatted following standard academic conventions with XeLaTeX and Unicode Times New Roman.

## Directory Contents

- `main.tex`: Master XeLaTeX source file containing the report structure, styling, title page with HUST branding, and academic sections written in Vietnamese.
- `references.bib`: BibTeX bibliography database containing literature references (Kasavana & Smith, AHP, TOPSIS, DSS foundations).
- `logo.png`: University emblem (HUST) displayed on the title cover.
- `images/`: Directory storing charts, pipeline diagrams, and screenshot assets for the report.

## Prerequisites

To compile the report, you need a TeX distribution supporting **XeLaTeX** and modern Unicode/system fonts:
- **Windows**: [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)
- **Linux**: `texlive-full` or `texlive-xetex`
- **macOS**: [MacTeX](https://www.tug.org/mactex/)

The template requires the **Times New Roman** font installed on your system.

## Compilation Instructions

### Using Makefile from Project Root
From the project root:
```bash
make report
```

### Manual Compilation via Command Line
Run the following standard sequence in this directory (`report/`):

```bash
# 1. First pass with XeLaTeX
xelatex main.tex

# 2. Process BibTeX citations
bibtex main

# 3. Second pass to resolve citations
xelatex main.tex

# 4. Final pass to resolve cross-references and table of contents
xelatex main.tex
```

Or using `latexmk`:
```bash
latexmk -xelatex main.tex
```

Or even easier, if enabled:

Save the file for auto compile and use Ctrl + Alt + V in IDE

### Cleaning Temporary Build Files
```bash
make clean-report
```
Or manually delete `*.aux`, `*.bbl`, `*.blg`, `*.log`, `*.out`, `*.toc`, `*.lof`, `*.lot`, `*.synctex.gz`.
