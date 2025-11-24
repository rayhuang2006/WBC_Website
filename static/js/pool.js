// static/js/pool.js

/**
 * 繪製雷達圖的函式
 * @param {Array} allData - 從 Flask 傳過來的隊伍資料列表
 */
function drawRadarChart(allData) {
    // 假設 scale 函數已定義在全局範圍或此函數外部
    // function scale(val, minVal, maxVal) { ... } 

    // 1. 準備資料
    const teamData = allData.flask;
    const hittingData = allData.hitting;
    const pitchingData = allData.pitching;

    // 2. 定義標籤 (5 個軸線)
    const labels = ["ERA 戰力", "OPS 戰力", "WHIP 戰力", "OBP 戰力", "SLG 戰力"];
    

    // 3. 處理數據
    teamData.forEach(team => {
        // 每個隊伍一個雷達圖
        const traces = [];

        // 查找對應數據物件
        const pitchingTeamData = pitchingData.find(t => t.Team === team.name);
        const hittingTeamData = hittingData.find(t => t.Team === team.name);

        // 使用可選鏈 (?.) 和空值合併 (||) 確保數據安全且是數字 (默認為 0)
        // 這是為了防止 find 失敗 (返回 undefined) 或數據本身無效 (返回 NaN)
        const rawEra = parseFloat(pitchingTeamData?.ERA || 0);
        const rawOps = parseFloat(hittingTeamData?.OPS || 0);
        const rawWhip = parseFloat(pitchingTeamData?.WHIP || 0);
        const rawObp = parseFloat(hittingTeamData?.OBP || 0);
        const rawSlg = parseFloat(hittingTeamData?.SLG || 0);

        // --- 戰力分數計算 ---
        // 建議：將範圍設定得更貼近您的數據分佈，這裡只是示例範圍
        const eraScore = (1 - scale(rawEra, 0.0, 10.0)) * 100; // 越低越好
        const opsScore = scale(rawOps, 0.3, 1.0) * 100;        // 越高越好
        const whipScore = (1 - scale(rawWhip, 0.0, 5.0)) * 100; // 越低越好
        const obpScore = scale(rawObp, 0.2, 0.5) * 100;        // 越高越好
        const slgScore = scale(rawSlg, 0.3, 1.0) * 100;        // 越高越好

        // --- 修正 3: 確保雷達圖閉環 ---
        const scores = [eraScore, opsScore, whipScore, obpScore, slgScore];

        // 複製第一個分數和第一個標籤到陣列末尾，形成閉環
        const r_closed = [...scores, scores[0]];
        const theta_closed = [...labels, labels[0]];

        traces.push({
            type: "scatterpolar",
            r: r_closed, // 使用閉環數據
            theta: theta_closed, // 使用閉環標籤
            fill: "toself",
            name: team.name
        });


        // 4. 設定佈局
        const layout = {
            title: '各隊投打戰力雷達圖', // 建議加上標題
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100] // 固定範圍 0-100
                }
            },
            // 添加圖例，讓用戶知道顏色對應哪個隊伍
            showlegend: true,
            autosize: true
        };

        // . 繪製 (確認 HTML 中有 id="radarPlot" 且有足夠的尺寸)
        const plotDivId = `team-${team.name}-plot`;
        if (!document.getElementById(plotDivId)) {
            console.error(`Plotly 錯誤：找不到 ID 為 ${plotDivId} 的繪圖容器。`);
            return;
        }
        Plotly.newPlot(plotDivId, traces, layout);
    });
}

/**
 * 繪製長條圖並綁定點擊事件
 * @param {Array} allData - 從 Flask 傳過來的隊伍資料
 */
function drawBarChart(allData) {
    // 1. 準備資料
    // 我們把每個隊伍的名稱和數值提取出來變成陣列
    const teamData = allData.flask; // 假設我們從 Flask 傳來的資料在 allData.flask
    const hittingData = allData.hitting; // CSV 打擊數據
    const pitchingData = allData.pitching; // CSV 投手數據

    const teamNames = teamData.map(team => team.name);

    // 標準化分數到 0-100 範圍 (假設 ERA 越低越好，OPS 越高越好)
    const eraScores = pitchingData.map(team => (1 - scale(team.ERA, 0.0, 10.0)) * 100);
    const opsScores = hittingData.map(team => scale(team.OPS, 0.3, 1.0) * 100);

    // 2. 設定 Trace (兩組長條)
    const trace1 = {
        x: teamNames,
        y: eraScores,
        name: 'ERA 戰力',
        type: 'bar',
        marker: { color: '#1f77b4' }, // 藍色
    };

    const trace2 = {
        x: teamNames,
        y: opsScores,
        name: 'OPS 戰力',
        type: 'bar',
        marker: { color: '#ff7f0e' }, // 橘色
    };

    const data = [trace1, trace2];

    // 3. 設定 Layout
    const layout = {
        title: '各隊投打戰力比較',
        barmode: 'group', // 'group' 會讓長條並排顯示
        xaxis: { title: '隊伍名稱' },
        yaxis: { title: '戰力評分 (0-100)' },
        autosize: true
    };

    // 4. 繪製圖表
    const plotDivId = 'barPlot';
    Plotly.newPlot(plotDivId, data, layout);
}

// --- 1. 定義輔助函數 ---
function scale(val, minVal, maxVal) {
    if (maxVal === minVal) {
        return 0;
    }
    const scaledValue = (val - minVal) / (maxVal - minVal);
    return Math.max(0, Math.min(1, scaledValue));
}