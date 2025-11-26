// static/js/player.js

document.addEventListener('DOMContentLoaded', function() {
    // 檢查全域變數 playerData 是否存在 (由 HTML 傳入)
    if (typeof playerData === 'undefined' || !playerData) {
        console.error("錯誤：找不到球員資料 (playerData)");
        return;
    }

    // 執行繪圖函式
    drawBarChart(playerData);
    drawPieChart(playerData);
});

// --- 1. 繪製長條圖 (Bar Chart) ---
function drawBarChart(player) {
    let xValues = [];
    let yValues = [];
    let barColors = [];
    let chartTitle = "";

    if (player.type === 'batter') {
        // 打者：顯示 AVG, OBP, SLG, OPS
        xValues = ['AVG', 'OBP', 'SLG', 'OPS'];
        yValues = [player.avg, player.obp, player.slg, player.ops];
        barColors = ['#1f77b4', '#1f77b4', '#1f77b4', '#2ca02c']; // OPS 用綠色凸顯
        chartTitle = "打擊三圍 & OPS";
    } else {
        // 投手：顯示 WHIP, ERA
        xValues = ['WHIP', 'ERA'];
        yValues = [player.whip, player.era];
        barColors = ['#ff7f0e', '#d62728']; // 橘色, 紅色
        chartTitle = "投手關鍵數據";
    }

    const trace = {
        x: xValues,
        y: yValues,
        type: "bar",
        text: yValues.map(String), // 顯示數值
        textposition: 'auto',
        marker: { color: barColors }
    };

    const layout = {
        title: chartTitle,
        margin: { t: 40, b: 40, l: 40, r: 20 },
        yaxis: { title: '數值' }
    };

    // 繪製到 id="stat-chart" 的 div
    Plotly.newPlot("stat-chart", [trace], layout, {responsive: true, displayModeBar: false});
}

// --- 2. 繪製圓餅圖 (Pie Chart) ---
function drawPieChart(player) {
    let rawLabels = [];
    let rawValues = [];
    let rawColors = [];
    let chartTitle = "";
    let holeSize = 0.4;

    // 1. 準備原始數據
    if (player.type === 'batter') {
        rawLabels = ['一壘安打', '二壘安打', '三壘安打', '全壘打', '出局'];
        rawValues = [player['1b'], player['2b'], player['3b'], player.hr, player.out];
        rawColors = ['#1f77b4', '#2ca02c', '#9467bd', '#d62728', '#7f7f7f'];
        chartTitle = "打席結果分佈";
    } else {
        rawLabels = ['三振 (SO)', '保送 (BB)'];
        rawValues = [player.so, player.bb];
        rawColors = ['#ff7f0e', '#1f77b4'];
        chartTitle = "三振 vs 保送";
    }

    // 2. 過濾掉數值為 0 的項目 (關鍵步驟！)
    // 這樣圖表上就不會出現 "0%" 的標籤擠在一起
    let finalLabels = [];
    let finalValues = [];
    let finalColors = [];

    for (let i = 0; i < rawValues.length; i++) {
        if (rawValues[i] > 0) {
            finalLabels.push(rawLabels[i]);
            finalValues.push(rawValues[i]);
            finalColors.push(rawColors[i]);
        }
    }

    const pieContainer = document.getElementById('pie-chart');
    
    // 計算過濾後的總和，如果完全沒數據 (總和 0)，顯示無數據提示
    const totalData = finalValues.reduce((a, b) => a + b, 0);

    if (totalData === 0) {
        pieContainer.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                <div>
                    <h4 style="color: #6c757d; margin: 0;">無數據</h4>
                    <p style="color: #adb5bd; font-size: 0.9em; margin: 5px 0 0 0;">
                        ${player.type === 'batter' ? '無安打或出局紀錄' : '無三振或保送紀錄'}
                    </p>
                </div>
            </div>
        `;
    } else {
        // 如果有數據，開始畫圖
        const trace = {
            values: finalValues, // 使用過濾後的數據
            labels: finalLabels,
            type: 'pie',
            hole: holeSize,
            
            // 設定顯示內容：標籤 + 數值 + 百分比
            // <br> 是換行，讓排版好看一點
            textinfo: 'label+value+percent', 
            
            // 強制文字在外部，避免擠在圖裡面
            textposition: 'outside',
            
            // 設定字體大小
            textfont: { size: 14 },

            marker: { colors: finalColors },
            
            // 滑鼠移上去的提示內容
            hovertemplate: '<b>%{label}</b><br>數值: %{value}<br>比例: %{percent}<extra></extra>'
        };

        const layout = {
            title: chartTitle,
            showlegend: true,
            // 增加邊距，讓外部文字有空間顯示
            margin: { t: 60, b: 60, l: 60, r: 60 }
        };

        Plotly.newPlot("pie-chart", [trace], layout, {responsive: true, displayModeBar: false});
    }
}