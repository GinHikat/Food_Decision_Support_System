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
│   ├── raw/                        # Raw source datasets (menu, sales, food items)
│   ├── processed/
│   │   ├── menu_dss_master.csv     # Unified 39-dish master dataset (22 columns)
│   │   ├── customers.csv           # 20 customer profiles (diet, allergies, preferences)
│   │   ├── dining_sessions.csv     # 30 contextual meal sessions
│   │   ├── customer_sessions_master.csv # Joined customer + session context view
│   │   └── data_desc.md            # Detailed dataset schema documentation (Vietnamese)
│   ├── combine/                    # Intermediate combined data assets
│   └── .gitkeep
├── demo/                           # Interactive Web Demo (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── RadarChart.jsx      # 4-axis Spider chart comparing Option A/B/C/D
│   │   │   ├── RestaurantMenuModal.jsx # Full 39-dish searchable menu viewer
│   │   │   └── ScenarioDetailModal.jsx # Full dish breakdown modal for selected option
│   │   ├── data/
│   │   │   └── dssData.json        # Exported menu & session data for web demo
│   │   ├── utils/
│   │   │   └── dssEngine.js        # Hard filters, TOPSIS engine & 4-scenario composer
│   │   ├── App.jsx                 # Main interactive web interface
│   │   ├── index.css               # Fresh Organic theme styles & Tailwind v4
│   │   └── main.jsx                # React entrypoint
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── PROJECT_SPEC.md             # Problem definition, algorithms & UI specification
├── modules/                        # Python DSS & Data Pipeline modules
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── data_pipeline.py        # ETL pipeline generating processed datasets
│   │   ├── menu_analysis.py        # Menu engineering & Kasavana-Smith classification
│   │   └── dss_model.py            # MCDM weighted scoring & utility calculation
│   └── main.py                     # Python CLI prototype entrypoint
├── report/
│   ├── images/
│   │   └── .gitkeep                # Figures and diagrams for the formal report
│   ├── logo.png                    # HUST university emblem for report title page
│   ├── main.tex                    # Master XeLaTeX report template (Vietnamese, 5 chapters)
│   ├── references.bib              # Academic BibTeX citations (DSS, AHP, TOPSIS)
│   └── README.md                   # XeLaTeX compilation guidelines
├── tests/
│   └── test_menu_analysis.py       # Unit test suite
├── .gitignore                      # Git exclusions for Python, Node & XeLaTeX build files
├── constraints.txt                 # Pinned Python dependency constraints
├── Makefile                        # Task automation shortcuts
├── PRODUCT.md                      # Product context & design brief
├── pyproject.toml                  # Modern Python PEP 621 configuration & dependencies
└── README.md                       # Project documentation
```

---

## Getting Started and Installation

### Prerequisites
- **Python**: Version >= 3.10 installed.
- **Node.js & npm**: Node.js >= 18 and npm (required for the interactive web demo in `demo/`).
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

### 1. Interactive Web Demo (React + Vite + Tailwind CSS in `demo/`)
Make sure to install the frontend dependencies first (`npm install`), then start the local dev server (`npm run dev`):

```bash
cd demo
npm install
npm run dev
```

Open your browser at `http://localhost:5173` to explore:
- Quick dining presets (`S001`–`S030`) and manual priority sliders (Cost, Best-seller, Healthy, Culinary Experience)
- Restaurant full menu viewer (39 dishes with ingredients, allergens, calories, satiety, and availability)
- 2x2 recommended menu scenarios (Option A: Balanced TOPSIS, Option B: Cost-Optimized, Option C: Culinary Experience, Option D: Best-seller)
- Interactive 4-axis Radar (Spider) chart and detailed TOPSIS ranking table

### 2. CLI Prototype Demo & Data Pipeline (Python in `modules/`)
Run the Python CLI demo directly:
```bash
python modules/main.py
```

Regenerate the processed datasets from `data/raw/`:
```bash
python modules/modules/data_pipeline.py
```

<!-- ### Expected Output Preview

```plaintext

``` -->

---

## Makefile Automation

For convenience, routine workflows are wrapped in a cross-platform `Makefile`:

| Target | Command | Purpose |
|---|---|---|
| `make install` | `uv pip install -e . -c constraints.txt` | Install Python project and dependencies |
| `make dev` | `uv run dev` | Launch the Python CLI demo via `uv` |
| `make web` | `cd demo && npm run dev` | Launch the interactive React + Vite web demo |
| `make run` | `python modules/main.py` | Run Python CLI demo script directly |
| `make test` | `pytest tests/` | Execute automated test suite |
| `make lint` | `ruff check modules/` | Run code quality checks |
| `make format` | `ruff format modules/` | Auto-format Python code |
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
