.PHONY: help install dev run test lint format report clean clean-report

PYTHON ?= python
UV ?= uv

help:
	@echo "Available commands:"
	@echo "  make install       Install dependencies using constraints.txt"
	@echo "  make dev           Run interactive demo via uv (uv run dev)"
	@echo "  make run           Run demo directly with python (python demo/main.py)"
	@echo "  make test          Run pytest suite"
	@echo "  make lint          Run linter check (ruff)"
	@echo "  make format        Auto-format codebase with ruff"
	@echo "  make report        Compile XeLaTeX report (report/main.tex)"
	@echo "  make clean         Clean Python cache artifacts"
	@echo "  make clean-report  Clean LaTeX build artifacts"

install:
	@echo "Installing project dependencies..."
	$(UV) pip install -e . -c constraints.txt || $(PYTHON) -m pip install -e . -c constraints.txt

dev:
	$(UV) run dev

run:
	$(PYTHON) demo/main.py

test:
	$(PYTHON) -m pytest tests/

lint:
	$(PYTHON) -m ruff check demo/

format:
	$(PYTHON) -m ruff format demo/

report:
	@echo "Compiling XeLaTeX report..."
	cd report && xelatex -interaction=nonstopmode main.tex
	cd report && bibtex main
	cd report && xelatex -interaction=nonstopmode main.tex
	cd report && xelatex -interaction=nonstopmode main.tex
	@echo "Report compiled successfully to report/main.pdf"

clean:
	@echo "Cleaning Python bytecode and cache..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

clean-report:
	@echo "Cleaning LaTeX temporary build files..."
	cd report && rm -f *.aux *.bbl *.blg *.log *.out *.toc *.lof *.lot *.synctex.gz
