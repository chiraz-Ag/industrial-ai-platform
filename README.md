# AXIALAI — Intelligent Industrial AI Platform for Turbofan Engine Prognostics & Maintenance

> An end-to-end Industrial AI platform combining **Predictive Maintenance**, **Remaining Useful Life (RUL) Prediction**, and **Industrial Document Intelligence** through a Retrieval-Augmented Generation (RAG) assistant.

---

## 📌 Overview

**AXIALAI** is an intelligent Industrial AI platform designed to support predictive maintenance and technical decision-making for turbofan engines.

The platform combines two complementary AI capabilities:

1. **Predictive Maintenance** — predicts the Remaining Useful Life (RUL) of aircraft engine units using sensor data.
2. **Industrial Document Intelligence** — provides an AI-powered assistant capable of retrieving and answering questions from maintenance manuals, technical reports, and industrial documentation.

The objective is to transform raw industrial data and technical documentation into **actionable maintenance insights** through a unified interface.

---

## 🎯 Key Objectives

- Predict engine degradation before failure.
- Estimate the Remaining Useful Life of individual engine units.
- Monitor the health status of an industrial fleet.
- Identify critical and warning engine units.
- Provide an intelligent assistant for technical documentation.
- Retrieve relevant information from industrial documents using RAG.
- Centralize predictive analytics and document intelligence in a single platform.

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │        AXIALAI           │
                         │   Industrial AI Platform │
                         └────────────┬─────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │                                           │
                ▼                                           ▼
      ┌──────────────────────┐                  ┌──────────────────────┐
      │ Predictive Maintenance│                  │ Document Intelligence│
      │        Engine         │                  │      / RAG Engine    │
      └──────────┬───────────┘                  └──────────┬───────────┘
                 │                                         │
                 ▼                                         ▼
      ┌──────────────────────┐                  ┌──────────────────────┐
      │    C-MAPSS Data      │                  │ Industrial Documents │
      │ FD001-FD004 datasets │                  │ Manuals / Reports    │
      └──────────┬───────────┘                  └──────────┬───────────┘
                 │                                         │
                 ▼                                         ▼
      ┌──────────────────────┐                  ┌──────────────────────┐
      │ CNN-LSTM / BiLSTM    │                  │ Hybrid Retrieval     │
      │      RUL Model       │                  │ FAISS + BM25 + RRF  │
      └──────────┬───────────┘                  └──────────┬───────────┘
                 │                                         │
                 ▼                                         ▼
      ┌──────────────────────┐                  ┌──────────────────────┐
      │ Health Classification│                  │ RAG + LLM Generation│
      │ Critical / Warning   │                  │ Answers + Sources    │
      │ Healthy              │                  └──────────────────────┘
      └──────────────────────┘
```

---

# 🚀 Main Features

## 1. Predictive Maintenance

AXIALAI uses turbofan engine sensor data to estimate the **Remaining Useful Life (RUL)** of each engine unit.

The system can:

- Upload C-MAPSS datasets in CSV/TXT format.
- Process multiple engine units.
- Apply the required feature selection and preprocessing.
- Generate sliding windows from temporal sensor data.
- Predict RUL using a trained deep learning model.
- Assign a health status to each engine.
- Monitor the entire fleet through a centralized dashboard.

### Health Status

Engine units are categorized according to their predicted RUL:

| Status          | Meaning                                  |
| --------------- | ---------------------------------------- |
| 🟢 **Healthy**  | Sufficient remaining operational life    |
| 🟠 **Warning**  | Increased degradation risk               |
| 🔴 **Critical** | Immediate maintenance attention required |

---

# ✈️ NASA C-MAPSS Dataset

The predictive maintenance component is based on the **NASA C-MAPSS (Commercial Modular Aero-Propulsion System Simulation)** dataset.

The dataset contains simulated turbofan engine degradation trajectories under different operating conditions.

AXIALAI supports:

- **FD001**
- **FD002**
- **FD003**
- **FD004**

Each dataset contains:

- Engine unit identifiers
- Operational cycles
- Operational settings
- Multiple sensor measurements

For the datasets with multiple operating conditions, operational settings are incorporated into the model input.

---

# 🧠 Predictive Maintenance Model

Several deep learning architectures were investigated during development:

- LSTM
- GRU
- 1D-CNN
- CNN-LSTM
- Bidirectional LSTM
- CNN-BiLSTM

The final architecture combines convolutional layers with a bidirectional recurrent layer to capture both local sensor patterns and temporal degradation behavior.

### Example Architecture

```text
Input Sensor Sequence
        │
        ▼
   Conv1D Layer
        │
        ▼
   Dropout
        │
        ▼
   Conv1D Layer
        │
        ▼
Bidirectional LSTM
        │
        ▼
    Dense Layer
        │
        ▼
   RUL Prediction
```

### Training Configuration

| Parameter      | Value              |
| -------------- | ------------------ |
| Framework      | TensorFlow / Keras |
| Optimizer      | Adam               |
| Loss           | Mean Squared Error |
| Batch Size     | 128                |
| Maximum Epochs | 100                |
| Early Stopping | Patience 15        |
| Learning Rate  | 0.001              |
| LR Scheduler   | ReduceLROnPlateau  |
| Dropout        | 0.1                |
| Window Size    | 30–50 cycles       |
| Random Seed    | 42                 |

---

# 📊 Model Performance

Hyperparameter optimization was performed using **Weights & Biases (W&B) Sweeps**.

One of the best experiments achieved approximately:

| Metric     |     Result |
| ---------- | ---------: |
| Test RMSE  |  **12.35** |
| Test MAE   |   **9.11** |
| NASA Score | **252.81** |

A later optimization experiment achieved a test MAE of approximately **8.77**.

The experiments were used to identify effective combinations of convolutional filters, kernel sizes, recurrent units, dropout, and learning rate.

---

# 📈 Fleet Monitoring Dashboard

The platform provides a fleet-level overview of engine health.

The dashboard displays:

- Total number of engine units
- Critical units
- Warning units
- Healthy units
- Individual engine status
- Predicted RUL
- Number of recorded cycles
- Sensor analysis
- Technical documentation access

### Example

```text
Fleet Summary

┌─────────────┬─────────────┬─────────────┐
│   Critical  │   Warning   │   Healthy   │
│      25     │      45     │     178     │
└─────────────┴─────────────┴─────────────┘
```

Selecting an engine unit provides detailed information such as:

- Engine identifier
- Dataset
- Recorded cycles
- Predicted RUL
- Health status
- Sensor analysis
- Access to the document assistant

---

# 📚 Industrial Document Intelligence

The second major component of AXIALAI is an AI-powered **Industrial Document Intelligence** system.

It allows users to ask questions about technical documentation instead of manually searching through large maintenance manuals and reports.

The system is based on **Retrieval-Augmented Generation (RAG)**.

---

# 🔎 RAG Pipeline

The RAG pipeline follows several stages:

```text
Industrial Documents
        │
        ▼
 Document Loading
        │
        ▼
 Text Extraction
        │
        ▼
 Chunking
        │
        ▼
 Embedding Generation
        │
        ├───────────────┐
        ▼               ▼
     FAISS            BM25
   Vector Search   Lexical Search
        │               │
        └───────┬───────┘
                ▼
       Hybrid Retrieval
                │
                ▼
       Cross-Encoder Reranking
                │
                ▼
 Reciprocal Rank Fusion (RRF)
                │
                ▼
        Relevant Context
                │
                ▼
             LLM
                │
                ▼
        Answer + Sources
```

---

# 🧩 RAG Components

### Document Processing

The knowledge base is built from curated industrial and technical documentation.

The ingestion pipeline supports multiple document formats and converts their contents into searchable text chunks.

### Chunking

Documents are divided into overlapping chunks to preserve contextual information between neighboring sections.

```text
Chunk Size:      512 tokens
Chunk Overlap:    64 tokens
```

### Embeddings

The embedding model used for semantic retrieval is:

```text
BAAI/bge-large-en-v1.5
```

with 1024-dimensional embeddings.

### Vector Search

The generated embeddings are indexed using:

```text
FAISS
```

with an inner-product similarity search.

### Lexical Search

A **BM25** retriever is used alongside FAISS to improve retrieval for technical terms, identifiers, and exact terminology.

### Reranking

Retrieved documents are further refined using a **Cross-Encoder reranker**.

### Reciprocal Rank Fusion

The results from different retrieval strategies are combined using **Reciprocal Rank Fusion (RRF)**.

This hybrid strategy improves retrieval robustness by combining:

- Semantic similarity
- Keyword matching
- Cross-encoder relevance scoring

---

# 🤖 RAG Assistant

The document assistant allows users to ask natural-language questions about industrial documentation.

Example workflow:

```text
User Question
      │
      ▼
Hybrid Retrieval
      │
      ▼
Relevant Documents
      │
      ▼
Reranking
      │
      ▼
Context Construction
      │
      ▼
Language Model
      │
      ▼
Answer + Sources
```

The API exposes an endpoint for interacting with the assistant:

```text
POST /nlp/ask
```

Example request:

```json
{
  "question": "What maintenance actions are recommended when abnormal engine degradation is detected?",
  "history": []
}
```

Example response:

```json
{
  "answer": "The recommended maintenance actions include...",
  "sources": ["maintenance_manual.pdf", "technical_report.pdf"],
  "elapsed_seconds": 2.31
}
```

---

# ⚙️ Backend

The backend is implemented using **FastAPI**.

The backend is responsible for:

- RUL model inference
- Data preprocessing
- Fleet analysis
- RAG communication
- NLP requests
- Health monitoring
- API routing

### Example Backend Structure

```text
backend/
│
├── app/
│   ├── nlp/
│   │   ├── router.py
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── config.py
│   ├── database.py
│   └── main.py
│
├── .env
├── .gitignore
│
├── cnn_lstm_combined_best.keras
├── kmeans_fd002.pkl
├── kmeans_fd004.pkl
│
└── main.py
```

---

# 🖥️ Frontend

The platform provides an interactive dashboard designed for industrial monitoring.

The interface includes:

- Fleet overview
- Engine unit list
- Engine health indicators
- RUL predictions
- Sensor analysis
- Document assistant
- File upload
- Authentication
- Responsive dashboard components

The interface is designed around a dark industrial monitoring theme with clear visual indicators for critical maintenance conditions.

---

# 🛠️ Technology Stack

## Artificial Intelligence

- Python
- TensorFlow
- Keras
- PyTorch
- Hugging Face Transformers
- LSTM
- CNN
- BiLSTM
- RAG
- Large Language Models

## Machine Learning

- Scikit-learn
- MinMaxScaler
- K-Means
- W&B Sweeps
- FAISS
- BM25

## Backend

- FastAPI
- Uvicorn
- Pydantic
- Python

## Frontend

- Next.js
- React
- TypeScript
- Material UI
- Tailwind CSS
- Recharts / Chart.js

## Data & Retrieval

- NASA C-MAPSS
- FAISS
- BM25
- BGE embeddings
- Cross-Encoder reranking

## Development & Deployment

- Google Colab
- Git
- GitHub
- ngrok
- Jupyter

---

# 🔌 API

## Health Check

```http
GET /nlp/health
```

Returns the current NLP service status, knowledge-base size, and available hardware.

Example:

```json
{
  "status": "ok",
  "kb_chunks": 3411,
  "gpu": "GPU"
}
```

---

## Ask the RAG Assistant

```http
POST /nlp/ask
```

Request:

```json
{
  "question": "What are the main causes of turbofan engine degradation?",
  "history": []
}
```

Response:

```json
{
  "answer": "The main causes include...",
  "sources": ["technical_manual.pdf"],
  "elapsed_seconds": 1.82
}
```

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/axialai.git
cd axialai
```

---

## 2. Create a Python Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

For the frontend:

```bash
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file for local configuration.

Example:

```env
NLP_SERVER_URL=http://localhost:8000
MODEL_PATH=./cnn_lstm_combined_best.keras
```

If using an external tunnel or API service, store credentials in environment variables rather than hard-coding them in source code.

> **Security note:** Never commit API keys, authentication tokens, or private credentials to GitHub.

---

# ▶️ Running the Platform

## Start the Backend

```bash
uvicorn backend.app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

---

## Start the Frontend

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 📂 Data Input

The predictive maintenance module accepts C-MAPSS-style engine datasets.

Typical input fields include:

```text
unit_id
cycle
operational_setting_1
operational_setting_2
operational_setting_3
sensor_01
sensor_02
...
sensor_21
```

The preprocessing pipeline automatically performs the required:

- Feature selection
- Scaling
- Temporal window construction
- Model inference

---

# 🔬 Project Workflow

The complete workflow can be summarized as:

```text
1. Upload Engine Dataset
           │
           ▼
2. Data Validation & Preprocessing
           │
           ▼
3. Feature Selection & Scaling
           │
           ▼
4. Temporal Window Generation
           │
           ▼
5. CNN-BiLSTM RUL Prediction
           │
           ▼
6. Engine Health Assessment
           │
           ▼
7. Fleet Visualization
           │
           ├───────────────┐
           ▼               ▼
      Sensor Analysis   Documents
                           │
                           ▼
                    RAG Assistant
                           │
                           ▼
                    Technical Answer
                    + Sources
```

---

# 📊 Knowledge Base

The industrial document knowledge base contains approximately:

```text
3,400+ document chunks
```

covering several industrial and technical domains.

The knowledge base is designed to support questions related to:

- Aircraft maintenance
- Turbofan engines
- Industrial systems
- Technical procedures
- Maintenance documentation
- Safety and operational information

---

# 🧪 Experiments

During development, multiple approaches were evaluated.

### RUL Models

| Model      | Purpose                            |
| ---------- | ---------------------------------- |
| LSTM       | Baseline temporal model            |
| GRU        | Lightweight recurrent architecture |
| 1D-CNN     | Local temporal feature extraction  |
| CNN-LSTM   | Combined spatial-temporal modeling |
| BiLSTM     | Bidirectional temporal modeling    |
| CNN-BiLSTM | Optimized hybrid architecture      |

### RAG Retrieval

| Component     | Role                |
| ------------- | ------------------- |
| FAISS         | Semantic retrieval  |
| BM25          | Keyword retrieval   |
| Cross-Encoder | Relevance reranking |
| RRF           | Retrieval fusion    |
| LLM           | Answer generation   |

---

# 📁 Project Structure

```text
AXIALAI/
│
├── backend/
│   ├── app/
│   │   ├── nlp/
│   │   │   ├── router.py
│   │   │   ├── routes/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   │
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── .env
│   ├── .gitignore
│   ├── cnn_lstm_combined_best.keras
│   ├── kmeans_fd002.pkl
│   └── kmeans_fd004.pkl
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── ...
│
├── notebooks/
│   ├── predictive_maintenance/
│   └── rag/
│
├── data/
│   └── C-MAPSS/
│
├── requirements.txt
├── package.json
└── README.md
```

---

# 🌟 Why AXIALAI?

Traditional maintenance systems often treat predictive analytics and technical documentation as separate tools.

AXIALAI brings both capabilities together:

```text
                    AXIALAI
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Predictive Intelligence   Knowledge Intelligence
          │                         │
          ▼                         ▼
      "WHEN?"                  "WHY / HOW?"
          │                         │
          └────────────┬────────────┘
                       ▼
               Maintenance Decision
```

The predictive model estimates **when an engine may require attention**, while the RAG assistant helps users understand **what the technical documentation recommends doing**.

This creates a more complete decision-support workflow for industrial maintenance.

---

# 🔮 Future Improvements

Potential future developments include:

- Real-time sensor streaming
- Automated maintenance recommendations
- Multimodal document understanding
- PDF table and diagram understanding
- Anomaly detection
- Failure-mode classification
- Remaining Useful Life uncertainty estimation
- Explainable AI for RUL predictions
- Real-time fleet monitoring
- Cloud deployment
- Role-based access control
- Advanced maintenance scheduling
- Integration with industrial IoT platforms

---

# ⚠️ Disclaimer

AXIALAI is an academic and research-oriented Industrial AI project.

The predictions generated by the platform should be considered **decision-support information** and should not replace qualified engineering judgment, official maintenance procedures, or certified aviation maintenance documentation.

---

# 👩‍💻 Project

**AXIALAI — Intelligent Industrial AI Platform for Turbofan Engine Prognostics and Maintenance**

Developed as an Artificial Intelligence / Data Science engineering project combining:

- Predictive Maintenance
- Deep Learning
- Time-Series Analysis
- Natural Language Processing
- Retrieval-Augmented Generation
- Industrial Document Intelligence
- Full-Stack AI Engineering

---

## ⭐ Acknowledgements

This project builds upon publicly available research, datasets, open-source machine learning frameworks, and information retrieval technologies.

Special acknowledgement to NASA for the **C-MAPSS turbofan engine simulation dataset**, which provides the foundation for the predictive maintenance experiments.

---

## 📜 License

This project is intended for educational and research purposes.

If you plan to distribute or deploy the project commercially, review the licenses of all datasets, models, libraries, and external resources used by the platform before deployment.
