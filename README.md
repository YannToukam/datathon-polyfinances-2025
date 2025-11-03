# Datathon PolyFinances 2025 – Project
> Repository for the submission to the **Datathon PolyFinances 2025** (organized by PolyFinances at Polytechnique Montréal).  

## 🚀 Project Summary
This project builds a data‑driven solution to a finance‑oriented challenge posed during the datathon: real‑world financial / market / investment / risk problem solved with engineering, data science and AI techniques. The repository contains code, data pipelines, models, a web interface (or dashboard) and deployment instructions.  

## 📦 Repository Structure
```
/ (root)
├── data/                   ← raw and processed datasets
├── notebooks/              ← exploratory analysis & prototyping
├── src/                    ← main code (ingest, process, train, serve)
├── app/                    ← frontend / dashboard / UI code
├── docs/                   ← architecture diagrams, technical design, one‑pager
├── requirements.txt        ← Python dependencies
├── Dockerfile              ← containerisation (if used)
└── README.md               ← this file
```

## 🛠️ Getting Started
Follow these steps to get the project running locally:

### 1. Clone the repository
```bash
git clone https://github.com/YannToukam/datathon-polyfinances-2025.git
cd datathon-polyfinances-2025
```

### 2. Install dependencies
Ensure you have Python 3.11+ (or as specified) and optionally Docker.
Open the server folder in a terminal and run this command:
```bash
pip install -r requirements.txt
```

Ensure you have npm 11.6+
Open the react-app folder in a terminal and run this command:
```bash
npm i
```

### 3. Launch the server
Open the server folder in a terminal and run this command: 
```bash
python app.py
```

### 4. Launch the website
Open the react-app folder in a terminal and run this command:
```bash
npm run dev
```