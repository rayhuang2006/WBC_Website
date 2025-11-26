document.addEventListener('DOMContentLoaded', function() {
    // 確保有資料才執行
    if (typeof currentPlayer === 'undefined' || !currentPlayer) {
        console.error("無法獲取球員資料");
        return;
    }

    drawStatChart(currentPlayer);
});

function drawStatChart(player) {
    let xValues = [];
    let yValues = [];
    let barColors = [];
    let chartTitle = "";
    let yAxisTitle = "";

    // 邏輯判斷：是打者還是投手？
    if (player.type === 'batter') {
        // --- 打者設定 ---
        xValues = ['AVG (打擊率)', 'OBP (上壘率)', 'SLG (長打率)'];
        yValues = [player.avg, player.obp, player.slg];
        
        // 設定打者專屬顏色 (例如：藍色系)
        barColors = ['#1f77b4', '#1f77b4', '#1f77b4']; 
        chartTitle = `${player.name} - 打擊三圍數據`;
        yAxisTitle = "數值";

    } else if (player.type === 'pitcher') {
        // --- 投手設定 ---
        xValues = ['WHIP (每局被上壘率)', 'ERA (防禦率)'];
        yValues = [player.whip, player.era];
        
        // 設定投手專屬顏色 (例如：紅色/橘色系，區分不同數據)
        // WHIP 通常較低，ERA 較高，用不同顏色區分比較好看
        barColors = ['#ff7f0e', '#d62728']; 
        chartTitle = `${player.name} - 投手關鍵數據`;
        yAxisTitle = "數值";
    }

    // 建立 Plotly 的 Data Trace
    const trace = {
        x: xValues,
        y: yValues,
        type: 'bar',
        text: yValues.map(String), // 在柱狀圖上顯示數值
        textposition: 'auto',
        marker: {
            color: barColors,
            opacity: 0.8,
            line: {
                color: 'black',
                width: 1.5
            }
        }
    };

    // 建立 Layout (版面設定)
    const layout = {
        title: {
            text: chartTitle,
            font: { size: 24 }
        },
        xaxis: {
            tickfont: { size: 14 }
        },
        yaxis: {
            title: yAxisTitle,
            range: [0, Math.max(...yValues) * 1.2] // 讓 Y 軸稍微高一點，避免柱子頂到頭
        },
        paper_bgcolor: 'rgba(0,0,0,0)', // 背景透明 (配合你的 CSS)
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    // 響應式設定
    const config = {
        responsive: true,
        displayModeBar: false // 隱藏上方工具列，讓畫面更乾淨
    };

    // 繪圖
    Plotly.newPlot('stat-bar-chart', [trace], layout, config);
}