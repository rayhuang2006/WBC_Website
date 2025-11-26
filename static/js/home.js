function drawMapChart(pools) {
  if (!pools) {
    console.warn("drawMapChart: pools is undefined or null.");
    return;
  }

  const mapDivId = "world-map";
  const mapDiv = document.getElementById(mapDivId);
  if (!mapDiv) {
    console.warn(`drawMapChart: div #${mapDivId} not found.`);
    return;
  }
    // === 世界排名 2025/11/11 ===
    const wbscRank = {
        "Japan": 1,
        "Chinese Taipei": 2,
        "United States": 3,
        "Korea": 4,
        "Venezuela": 5,
        "Mexico": 6,
        "Puerto Rico": 7,
        "Panama": 8,
        "Cuba": 9,
        "Netherlands": 10,
        "Australia": 11,
        "Dominican Republic": 12,
        "Colombia": 13,
        "Italy": 14,
        "Czech Republic": 15,
        "Nicaragua": 16,
        "Great Britain": 19, 
        "Canada": 20,
        "Israel": 21,
        "Brazil": 22
    };
  // 如果 pools 裡隊名跟國家名不完全一樣，可以在這裡對照
  const nameToCountry = {
    "USA": "United States",
    "Chinese Taipei": "Chinese Taipei",
    "Great Britain": "Great Britain",
    "Korea": "Korea"
    // 其他像 Japan, Mexico, Cuba... 一般直接同名
  };

  const locations = [];  // 給 Plotly 的國家名稱
  const zValues  = [];  // 顏色用的數值（由排名轉換）
  const texts    = [];  // hover 顯示字串
  const custom   = [];  // 存隊名，點擊時跳 /team/<name>
  const seen = new Set();

  Object.entries(pools).forEach(([poolKey, poolObj]) => {
    const poolName = poolObj.name || ("Pool " + poolKey);
    const teams = poolObj.teams || [];

    teams.forEach(team => {
      const teamName = team.name;
      if (!teamName) return;

      const countryName = nameToCountry[teamName] || teamName;
      if (seen.has(countryName)) return;
      seen.add(countryName);

      const rank = wbscRank[countryName];

      // 只畫有在 wbscRank 裡的「參賽國」
      if (rank === undefined) return;
      locations.push(countryName);
      zValues.push(rank);
      custom.push(teamName);
      texts.push(`${teamName} (${poolName}) - World Rank: ${rank}`);
    });
  });

  const mapData = [{
    type: "choropleth",
    locationmode: "country names",
    locations: locations,
    z: zValues,
    text: texts,
    customdata: custom,
    hovertemplate: "%{text}<extra></extra>",
    colorscale: "Inferno",     // 越深顏色代表 value 越大 → 排名越前
    reversescale: true,
    showscale: true
  }];

  const mapLayout = {
    title: "WBC 參賽國世界排名",
    geo: {
      projection: { type: "robinson" },
      showland: true,
      landcolor: "White",   // 所有陸地的底色（沒參賽的國家也會顯示）

      showcountries: true,             // 🔑 顯示所有國家的邊界
      countrycolor: "rgba(0, 0, 0, 1)",
      countrywidth: 0.5,

      showcoastlines: true,
      coastlinecolor: "rgba(0, 0, 0, 1)",
      coastlinewidth: 0.5
    }
  };

  Plotly.newPlot(mapDivId, mapData, mapLayout);

  // 點國家 → 跳到該隊的 Team 頁面
  mapDiv.on("plotly_click", function (e) {
    if (!e || !e.points || !e.points.length) return;
    const teamName = e.points[0].customdata;
    if (teamName) {
      window.location.href = "/team/" + encodeURIComponent(teamName);
    }
  });
}

