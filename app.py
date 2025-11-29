from flask import Flask, render_template, request, jsonify
from utils.data_loader import load_json

app = Flask(__name__)

# --- 1. 首頁 ---
@app.route("/")
def index():
    pools = load_json("data/pools.json")
    return render_template("index.html", pools=pools)

# --- 2. 分組頁面 (L2) ---
@app.route("/pool/<pool_name>")
def pool_page(pool_name):
    pools = load_json("data/pools.json")
    teams_data = load_json("data/teams.json")

    # 取得該分組資訊
    pool_info = pools.get(pool_name.upper(), {})
    
    # 取得該分組所有隊伍的詳細資料
    pool_teams_raw = []
    team_names = pool_info.get("teams", [])
    
    for t in team_names:
        t_name = t["name"]
        if t_name in teams_data:
            team_obj = teams_data[t_name]
            # 確保有 iso_code (國旗用)，如果 JSON 裡沒有，這裡補上防呆
            team_obj['iso_code'] = t.get('iso_code', '') 
            pool_teams_raw.append(team_obj)

    # 資料前處理 (標準化分數，用於雷達圖)
    processed_teams = []
    for team in pool_teams_raw:
        stats = team.get("team_stats", {})
        era = stats.get("ERA", 10.0)
        ops = stats.get("OPS", 0.6)
        whip = stats.get("WHIP", 2.0)

        # 簡單的標準化公式
        def scale(val, min_val, max_val):
            return max(0, min(1, (val - min_val) / (max_val - min_val)))

        # ERA/WHIP 越低越好 -> (1 - score)
        era_score = (1 - scale(era, 0.0, 10.0)) * 100
        ops_score = scale(ops, 0.6, 1.0) * 100
        whip_score = (1 - scale(whip, 0.8, 2.0)) * 100
        
        team['normalized_stats'] = {
            "ERA": era_score,
            "OPS": ops_score,
            "WHIP": whip_score
        }
        processed_teams.append(team)

    # 傳送 team_list 給前端 (確保包含 iso_code)
    return render_template("pool.html", pool_name=pool_name, teams=processed_teams, team_list=pool_teams_raw)

# --- 3. 隊伍頁面 (L3) ---
@app.route("/team/<team_name>")
def team_page(team_name):
    teams = load_json("data/teams.json")
    players = load_json("data/players.json")

    team_info = teams.get(team_name, {})
    roster_ids = team_info.get("players", [])
    
    # 抓取球員物件
    full_roster = []
    for pid in roster_ids:
        p_data = players.get(pid)
        if p_data:
            full_roster.append(p_data)
            
    # 【關鍵修正】在後端就分好投手與打者，不要讓 HTML 去做運算
    pitchers = [p for p in full_roster if p.get('type') == 'pitcher']
    batters = [p for p in full_roster if p.get('type') == 'batter']

    return render_template(
        "team.html", 
        team_name=team_name, 
        team=team_info, 
        pitchers=pitchers, 
        batters=batters
    )

# --- 4. 球員頁面 (L4) ---
@app.route("/player/<player_id>")
def player_page(player_id):
    players = load_json("data/players.json")
    player = players.get(player_id)
    
    if not player:
        return "查無此球員", 404

    return render_template("player.html", player=player)

# --- 5. 對戰模擬器 ---
@app.route("/matchup")
def matchup_page():
    teams_data = load_json("data/teams.json")
    team_names = list(teams_data.keys())
    return render_template("matchup.html", team_names=team_names)

@app.route("/api/predict", methods=["POST"])
def predict_matchup():
    data = request.get_json()
    teamA_name = data.get("teamA")
    teamB_name = data.get("teamB")

    if not teamA_name or not teamB_name:
        return jsonify({"error": "Missing team names"}), 400

    teams_data = load_json("data/teams.json")
    teamA_stats = teams_data.get(teamA_name, {}).get("team_stats", {})
    teamB_stats = teams_data.get(teamB_name, {}).get("team_stats", {})

    try:
        # 取得數據，若無則給預設值
        ops_a = teamA_stats.get('OPS', 0.7)
        era_a = teamA_stats.get('ERA', 4.0)
        ops_b = teamB_stats.get('OPS', 0.7)
        era_b = teamB_stats.get('ERA', 4.0)
        
        # 簡易勝率演算法
        power_a = (ops_a * 1000) - (era_a * 50)
        power_b = (ops_b * 1000) - (era_b * 50)
        
        # 避免負數
        power_a = max(1, power_a)
        power_b = max(1, power_b)
        
        total = power_a + power_b
        prob_a = round(power_a / total, 2)
        prob_b = round(1.0 - prob_a, 2)

        winner = teamA_name if prob_a > prob_b else teamB_name

        return jsonify({
            "teamA": {"name": teamA_name, "win_probability": prob_a},
            "teamB": {"name": teamB_name, "win_probability": prob_b},
            "winner": winner
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)