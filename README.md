# Restaurant Menu Decision Support System (Menu-DSS)

A data-driven **Decision Support System (DSS)** prototype engineered for restaurant menu management, pricing optimization, and demand-profitability classification.

This repository serves as the official prototype and collaborative codebase for our **Decision Support System (DSS)** course group project at the **Hanoi University of Science and Technology (HUST)**.

## Project Overview

In restaurant management, menu items vary widely in ingredient cost, preparation labor, customer appeal, and profit contribution. Relying solely on intuition or basic sales reports often causes restaurants to underprice high-demand dishes, miss upselling opportunities, or retain unprofitable items.

**Restaurant Menu Decision Support System (Menu-DSS)** bridges this operational gap by integrating:
1. **Classic Menu Engineering** (Kasavana & Smith matrix: *Stars, Plowhorses, Puzzles, Dogs*).
2. **Multi-Criteria Decision Making (MCDM)**: Weighted scoring incorporating gross profit margin, sales volume, customer satisfaction rating, and kitchen preparation ease.
3. **Prescriptive Action Suggestions**: Automated, data-backed recommendations for pricing changes, portion engineering, recipe redesign, and menu repositioning.

---

## Key Features and Theoretical Framework

- **Kasavana & Smith Menu Engineering Matrix**:
  - **Stars** (*High Margin, High Popularity*): Protect quality, keep signature placement, maintain strict recipe consistency.
  - **Plowhorses** (*Low Margin, High Popularity*): High customer volume; optimize recipe cost, reduce portion size slightly, or apply subtle price increases.
  - **Puzzles** (*High Margin, Low Popularity*): Highly profitable; increase menu visibility, run promotional bundles, or train floor staff to upsell.
  - **Dogs** (*Low Margin, Low Popularity*): Unprofitable and unpopular; candidate for menu removal or conceptual reinvention.
- **MCDM Multi-Criteria Utility Model**:
  - Dynamically weights conflicting operational dimensions: Margin (35%), Sales Volume (30%), Customer Rating (20%), and Prep Speed (15%).
- **Actionable Decision Output**:
  - Outputs immediate next steps for chefs, floor managers, and restaurant owners.

---

## Repository Structure

```plaintext
Decision_Support/
├── data/
│   ├── .gitkeep
├── demo/
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── menu_analysis.py    # Menu engineering & Kasavana-Smith classification logic
│   │   └── dss_model.py        # MCDM weighted scoring & utility calculation
│   └── main.py                 # Interactive prototype CLI entrypoint
├── report/
│   ├── images/
│   │   └── .gitkeep            # Figures and diagrams for the formal report
│   ├── logo.png                # HUST university emblem for report title page
│   ├── main.tex                # Master XeLaTeX report template
│   ├── references.bib          # Academic BibTeX citations (DSS, AHP, Menu Engineering)
│   └── README.md               # XeLaTeX compilation guidelines
├── tests/
│   └── test_menu_analysis.py   # Unit test suite
├── .gitignore                  # Git exclusions for Python & XeLaTeX build files
├── constraints.txt             # Pinned dependency constraints for reproducible setup
├── Makefile                    # Task automation shortcuts
├── pyproject.toml              # Modern Python PEP 621 configuration & dependencies
└── README.md                   # Project documentation
```

---

## Getting Started and Installation

### Prerequisites
- **Python**: Version >= 3.10 installed.
- **uv** (Recommended): A fast Python package manager and project runner ([Installation Guide](https://github.com/astral-sh/uv)).
  ```bash
  # Windows (PowerShell)
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

  # macOS / Linux
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **XeLaTeX Distribution** (for compiling report): MiKTeX (Windows) or TeX Live / MacTeX with *Times New Roman* font.

---

### 1. Clone Repository

```bash
git clone https://github.com/<your-username-or-org>/Decision_Support.git
cd Decision_Support
```

---

### 2. Initialize Environment with uv (Recommended)

`uv` handles virtual environment creation and package installation in milliseconds:

```bash
# Create and sync virtual environment directly using constraints
uv venv
uv pip install -e . -c constraints.txt
```

---

### 3. Alternative Setup with Standard venv and pip

If you prefer standard Python tooling:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install editable package with constraints
pip install -e . -c constraints.txt
```

---

## Running the Prototype Demo

### Quick Run via `uv run dev`
Once inside the project directory, run:

```bash
uv run dev
```

### Direct Python Run
```bash
python demo/main.py
```

<!-- ### Expected Output Preview

```plaintext

``` -->

---

## Makefile Automation

For convenience, routine workflows are wrapped in a cross-platform `Makefile`:

| Target | Command | Purpose |
|---|---|---|
| `make install` | `uv pip install -e . -c constraints.txt` | Install project and dependencies |
| `make dev` | `uv run dev` | Launch the demo prototype via `uv` |
| `make run` | `python demo/main.py` | Run demo script via Python directly |
| `make test` | `pytest tests/` | Execute automated test suite |
| `make lint` | `ruff check demo/` | Run code quality checks |
| `make format` | `ruff format demo/` | Auto-format Python code |
| `make report` | `cd report && xelatex ...` | Compile the XeLaTeX academic report |
| `make clean` | `find ...` | Remove Python cache artifacts |
| `make clean-report` | `rm report/*.aux ...` | Remove temporary LaTeX compile artifacts |

---

## Compiling the XeLaTeX Report

The report source is located in `report/main.tex`, designed following the official HUST thesis/project format with dual decorative border, Vietnamese + English font support (`polyglossia` / `fontspec`), and clean bibtex citations.

To compile:
```bash
# Option 1: Using Makefile
make report

# Option 2: Manual build sequence in report/
cd report
xelatex main.tex
bibtex main
xelatex main.tex
xelatex main.tex
```
The compiled PDF will be generated at `report/main.pdf`.

---

## Team Members and Roles

**Course**: Decision Support System (DSS)  
**Institution**: Hanoi University of Science and Technology (HUST)  
**Supervisor / Lecturer**: [Instructor Name]

| Full Name | Student ID | Responsibilities | Contact |
|---|---|---|---|
| [Student Name 1] | [ID 1] | System Architecture & DSS Modeling | student1@hust.edu.vn |
| [Student Name 2] | [ID 2] | Data Pipelines & Analytics Engine | student2@hust.edu.vn |
| [Student Name 3] | [ID 3] | Interactive Demo & Evaluation | student3@hust.edu.vn |
| [Student Name 4] | [ID 4] | Formal Report & Benchmarks | student4@hust.edu.vn |

---

## License
This project is developed for educational and research purposes under the MIT License.
