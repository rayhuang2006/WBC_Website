// static/js/pool.js

/**
 * 繪製雷達圖的函式
 * @param {Array} teamData - 從 Flask 傳過來的隊伍資料列表
 */
function drawRadarChart(teamData) {
    // 1. 定義標籤
    const labels = ["ERA 戰力", "OPS 戰力", "WHIP 戰力"];
    const traces = [];

    // 2. 處理數據
    teamData.forEach(team => {
        // 讀取標準化後的分數
        // 確保你的資料結構中真的有 normalized_stats 這個欄位
        let stats = team.normalized_stats;

        traces.push({
            type: "scatterpolar",
            r: [stats.ERA, stats.OPS, stats.WHIP],
            theta: labels,
            fill: "toself",
            name: team.name
        });
    });

    // 3. 設定佈局
    const layout = {
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100] // 固定範圍 0-100
            }
        },
        // 讓圖表隨著視窗大小自動調整 (RWD)
        autosize: true
    };

    // 4. 繪製
    Plotly.newPlot("radarPlot", traces, layout);
}

/**
 * 繪製長條圖並綁定點擊事件
 * @param {Array} teamData - 從 Flask 傳過來的隊伍資料
 */
function drawBarChart(teamData) {
    // 1. 準備資料
    // 我們把每個隊伍的名稱和數值提取出來變成陣列
    const teamNames = teamData.map(team => team.name);
    const teamIds = teamData.map(team => team.id); // 為了下鑽跳轉用

    // 假設我們要比較 ERA 和 OPS 的戰力分數
    const eraScores = teamData.map(team => team.normalized_stats.ERA);
    const opsScores = teamData.map(team => team.normalized_stats.OPS);

    // 2. 設定 Trace (兩組長條)
    const trace1 = {
        x: teamNames,
        y: eraScores,
        name: 'ERA 戰力',
        type: 'bar',
        marker: { color: '#1f77b4' }, // 藍色
        // 把 teamId 藏在 customdata 裡，方便點擊時取用
        customdata: teamIds
    };

    const trace2 = {
        x: teamNames,
        y: opsScores,
        name: 'OPS 戰力',
        type: 'bar',
        marker: { color: '#ff7f0e' }, // 橘色
        customdata: teamIds
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