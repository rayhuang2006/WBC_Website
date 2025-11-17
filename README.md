# 專題：WBC 經典賽戰力分析儀表板

這是「資料視覺化」課程的期末專題。

本專案使用 Python Flask 作為後端，Plotly.js 作為前端視覺化工具，打造一個具備下鑽式 (Drill-Down) 功能的 WBC 數據儀表板。

## 技術棧 (Tech Stack)

- **後端:** Python, Flask
- **前端:** HTML, Plotly.js
- **資料:** JSON

## 如何執行 (How to Run)

1.  **Clone 專案**
    ```bash
    git clone (您 GitHub 倉庫的 URL)
    cd final_project
    ```

2.  **建立並啟動虛擬環境**
    ```bash
    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    
    # Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **安裝依賴套件**
    ```bash
    pip install -r requirements.txt
    ```

4.  **啟動 Flask 伺服器**
    ```bash
    python app.py
    ```

5.  **開啟瀏覽器**
    - 造訪 `http://127.0.0.1:5000`