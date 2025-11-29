// static/js/pool.js

/**
 * 輔助函式：線性標準化 (Min-Max Scaling)
 * 用於將不同單位的數據轉換為 0~1 之間的比例
 */
function scale(val, minVal, maxVal) {
    if (maxVal === minVal) return 0;
    const scaledValue = (val - minVal) / (maxVal - minVal);
    return Math.max(0, Math.min(1, scaledValue));
}

/**
 * 1. 繪製雷達圖 (Radar Chart)
 * 功能：顯示各隊五維戰力 (ERA, OPS, WHIP, OBP, SLG)
 * 樣式：深色透明背景、亮藍色線條
 */
function drawRadarChart(allData) {
    const teamData = allData.flask;     // 從 Flask 來的基礎資料
    const hittingData = allData.hitting; // CSV 打擊數據
    const pitchingData = allData.pitching; // CSV 投手數據

    // 雷達圖的五個維度標籤
    const labels = ["ERA 戰力", "OPS 戰力", "WHIP 戰力", "OBP 戰力", "SLG 戰力"];

    teamData.forEach(team => {
        // 1. 數據查找與防呆 (使用 ?. 避免找不到資料時報錯)
        const pitchingTeamData = pitchingData.find(t => t.Team === team.name);
        const hittingTeamData = hittingData.find(t => t.Team === team.name);

        const rawEra = parseFloat(pitchingTeamData?.ERA || 0);
        const rawWhip = parseFloat(pitchingTeamData?.WHIP || 0);
        const rawOps = parseFloat(hittingTeamData?.OPS || 0);
        const rawObp = parseFloat(hittingTeamData?.OBP || 0);
        const rawSlg = parseFloat(hittingTeamData?.SLG || 0);

        // 2. 計算戰力分數 (0-100)
        // 投手數據 (ERA, WHIP) 是越低越好，所以用 (1 - scale) 反轉
        const eraScore = (1 - scale(rawEra, 0.0, 10.0)) * 100;
        const whipScore = (1 - scale(rawWhip, 0.0, 5.0)) * 100;
        // 打者數據是越高越好
        const opsScore = scale(rawOps, 0.3, 1.0) * 100;
        const obpScore = scale(rawObp, 0.2, 0.5) * 100;
        const slgScore = scale(rawSlg, 0.3, 1.0) * 100;

        const scores = [eraScore, opsScore, whipScore, obpScore, slgScore];

        // 3. 閉環處理 (Plotly 雷達圖需要把最後一個點連回第一個點)
        const r_closed = [...scores, scores[0]];
        const theta_closed = [...labels, labels[0]];

        // 4. 設定 Trace
        const data = [{
            type: "scatterpolar",
            r: r_closed,
            theta: theta_closed,
            fill: "toself",
            name: team.name,
            // 樣式：亮藍色線條，半透明填充
            line: { color: '#3b82f6', width: 2 },
            fillcolor: 'rgba(59, 130, 246, 0.2)',
            // Hover 顯示設定
            hovertemplate: "%{theta}: %{r:.1f} 分<extra></extra>"
        }];

        // 5. 設定 Layout (深色主題)
        const layout = {
            title: {
                text: `${team.name}`,
                font: { color: '#f1f5f9', size: 16 }
            },
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100],
                    linecolor: '#64748b', // 軸線顏色 (深灰)
                    gridcolor: '#334155', // 網格顏色 (更深灰)
                    tickfont: { color: '#94a3b8', size: 9 } // 刻度文字
                },
                angularaxis: {
                    tickfont: { color: '#f1f5f9', size: 12 }, // 外圈標籤顏色 (白)
                    gridcolor: '#334155'
                },
                bgcolor: 'rgba(0,0,0,0)' // 雷達圖背景透明
            },
            paper_bgcolor: 'rgba(0,0,0,0)', // 畫布背景透明
            showlegend: false,
            margin: { t: 40, b: 30, l: 40, r: 40 },
            autosize: true
        };

        // 6. 繪製圖表 (檢查容器是否存在)
        const plotDivId = `team-${team.name}-plot`;
        if (document.getElementById(plotDivId)) {
            Plotly.newPlot(plotDivId, data, layout, {displayModeBar: false});
        }
    });
}

/**
 * 2. 繪製長條圖 (Bar Chart)
 * 功能：比較各隊的 ERA (防禦率) 與 OPS (攻擊指數)
 * 整合：使用雙 Y 軸 (Dual Axis) 以解決數值比例懸殊問題
 */
function drawBarChart(allData) {
    const teamData = allData.flask;
    const pitchingData = allData.pitching;
    const hittingData = allData.hitting;

    // 提取所有隊名
    const teamNames = teamData.map(t => t.name);

    // 提取對應的 ERA 和 OPS 數據
    const eraValues = teamNames.map(name => {
        const row = pitchingData.find(r => r.Team === name);
        return row ? parseFloat(row.ERA) : 0;
    });

    const opsValues = teamNames.map(name => {
        const row = hittingData.find(r => r.Team === name);
        return row ? parseFloat(row.OPS) : 0;
    });

    // Trace 1: ERA (紅色，左軸)
    const trace1 = {
        x: teamNames,
        y: eraValues,
        name: 'ERA (越低越好)',
        type: 'bar',
        marker: { color: '#ef4444' }, // 紅色
        hovertemplate: "ERA: %{y}<extra></extra>"
    };

    // Trace 2: OPS (藍色，右軸)
    const trace2 = {
        x: teamNames,
        y: opsValues,
        name: 'OPS (越高越好)',
        type: 'bar',
        marker: { color: '#3b82f6' }, // 藍色
        yaxis: 'y2', // 指定使用第二個 Y 軸
        hovertemplate: "OPS: %{y}<extra></extra>"
    };

    const data = [trace1, trace2];

    const layout = {
        // title: { text: '投打關鍵數據比較', font: { color: '#fff' } }, // 標題已在 HTML h3 顯示，這裡省略讓畫面更乾淨
        barmode: 'group', // 分組排列
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f1f5f9' },
        
        // X 軸設定
        xaxis: {
            tickangle: -45,
            gridcolor: '#334155',
            tickfont: { color: '#cbd5e1' }
        },
        
        // 左 Y 軸 (ERA)
        yaxis: {
            title: 'ERA (防禦率)',
            titlefont: { color: '#ef4444' },
            tickfont: { color: '#ef4444' },
            gridcolor: '#334155',
            showgrid: true
        },
        
        // 右 Y 軸 (OPS)
        yaxis2: {
            title: 'OPS (攻擊指數)',
            titlefont: { color: '#3b82f6' },
            tickfont: { color: '#3b82f6' },
            overlaying: 'y', // 疊加在第一個 Y 軸之上
            side: 'right',   // 放在右邊
            showgrid: false  // 不顯示網格，避免太亂
        },
        
        legend: {
            orientation: 'h', // 圖例水平排列
            x: 0.5,
            xanchor: 'center',
            y: 1.1,
            font: { color: '#fff' }
        },
        margin: { b: 60, l: 60, r: 60, t: 50 },
        autosize: true
    };

    const plotDivId = 'barPlot';
    if (document.getElementById(plotDivId)) {
        Plotly.newPlot(plotDivId, data, layout, {displayModeBar: false});
    }
}