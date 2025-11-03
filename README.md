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
Open the server folden in the terminal and run this command:
```bash
pip install -r requirements.txt
```

Ensure you have npm 11.6+
Open the react-app 
```bash
pip install -r requirements.txt
```

### 3. Prepare data
Place raw dataset(s) into `data/raw/`. Then run the preprocessing script:  
```bash
python src/data_preprocessing.py --input data/raw/ --output data/processed/
```

### 4. Train the model (if applicable)
```bash
python src/train_model.py --data data/processed/ --model output/model.pkl
```

### 5. Launch the application / dashboard
If there’s a frontend, run:  
```bash
cd app
npm install      # or yarn
npm start        # or yarn start
```
Alternatively, to use a Flask/FastAPI backend:  
```bash
python src/app.py
```

### 6. (Optional) Run via Docker
```bash
docker build -t datathon-pf2025:latest .
docker run -p 8000:8000 datathon-pf2025:latest
```

## ✅ What You’ll Find
- Data ingestion, cleaning and transformation pipeline  
- Machine‑learning or statistical model to address the finance challenge  
- Interactive dashboard/UI to visualise results and support decision‑making  
- Documentation with explanation of architecture, design choices and insights  
- Deployment instructions for a public facing tool  

## 📘 Context
The Datathon PolyFinances 2025 is a **36‑hour intensive competition** where students solve a concrete financial problem using data science and engineering. ([polyfinances.ca](https://www.polyfinances.ca/datathon?utm_source=chatgpt.com))  
The challenge emphasises real‑world relevance, teaming, rapid prototyping, and deployment of a usable tool. ([datathon-polyfinances-2025.devpost.com](https://datathon-polyfinances-2025.devpost.com/?ref_feature=challenge&ref_medium=similar-hackathons&utm_source=chatgpt.com))

## 🧩 Why This Project Matters
- Bridges finance + data science: combining technical skills with domain knowledge  
- Rapid development under time constraints showcases agile thinking and teamwork  
- Provides a deployable proof‑of‑concept that can be expanded beyond the hackathon  

## 🔍 Next Steps / Enhancements
- Improve model performance (e.g., hyper‑parameter tuning, ensemble methods)  
- Add more data sources (market, macro‑economic, alternative data)  
- Harden the deployment (authentication, scaling, logging)  
- Add CI/CD pipeline, cloud deployment (AWS/GCP)  
- Turn into production‑ready service  

## 🙏 Acknowledgements
Thanks to the organising team at PolyFinances and Polytechnique Montréal for hosting the event. Special recognition to the partner institution La Caisse de dépôt et placement du Québec for their support. ([datathon-polyfinances-2025.devpost.com](https://datathon-polyfinances-2025.devpost.com/?ref_feature=challenge&ref_medium=similar-hackathons&utm_source=chatgpt.com))  

## 📄 License
Specify your licence (e.g., MIT) here if applicable.

