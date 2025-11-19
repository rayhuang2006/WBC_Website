from flask import Flask, render_template, request, jsonify
from utils.data_loader import load_json

app = Flask(__name__)


@app.route("/")
def index():
    pools = load_json("data/pools.json")
    return render_template("index.html", pools=pools)


@app.route("/pool/<pool_name>")
def pool_page(pool_name):
    pools = load_json("data/pools.json")
    teams_data = load_json("data/teams.json") # 確保變數名稱不衝突

    pool_info = pools.get(pool_name.upper(), {})
    print(f"Loading pool: {pool_name}, Info: {pool_info}")
    # 原始的隊伍資料
    pool_teams_raw = [teams_data[t["name"]] for t in pool_info.get("teams", [])]
    team_list = pool_info.get("teams", [])
    # --- 任務二：資料標準化 ---
    # 這裡我們建立一個新的列表，包含標準化後的統計數據
    # 假設：ERA 越低越好 (10 -> 0分, 0 -> 100分)
    # 假設：OPS 越高越好 (0.6 -> 0分, 1.0 -> 100分)
    # 假設：WHIP 越低越好 (2.0 -> 0分, 0.8 -> 100分)
    # 這些公式您可以自訂，這是一個很棒的簡報「資料前處理」點
    
    processed_teams = []
    for team in pool_teams_raw:
        stats = team.get("team_stats", {})
        
        # 使用 .get() 避免 KeyError，並提供預設值
        era = stats.get("ERA", 10.0)
        ops = stats.get("OPS", 0.6)
        whip = stats.get("WHIP", 2.0)

        # 簡易的線性標準化 (Min-Max Scaling)
        # (value - min) / (max - min)
        # 為了安全，我們使用 clip 確保值在 0-1 之間
        def scale(val, min_val, max_val):
            return max(0, min(1, (val - min_val) / (max_val - min_val)))

        # ERA/WHIP 是越低越好，所以用 (max - val)
        era_score = (1 - scale(era, 0.0, 10.0)) * 100
        ops_score = scale(ops, 0.6, 1.0) * 100
        whip_score = (1 - scale(whip, 0.8, 2.0)) * 100
        
        # 把新算好的分數加回 team 物件中
        team['normalized_stats'] = {
            "ERA": era_score,
            "OPS": ops_score,
            "WHIP": whip_score
        }
        processed_teams.append(team)
    # ---------------------------

    return render_template("pool.html", pool_name=pool_name, teams=processed_teams, team_list=team_list)


@app.route("/team/<team_name>")
def team_page(team_name):
    teams = load_json("data/teams.json")
    players = load_json("data/players.json")

    team_info = teams.get(team_name, {})
    
    # --- Bug 修復 ---
    # 您的 players.json 中沒有 "j3", "t2", "t3"
    # 這會導致點擊 Japan 或 Taiwan 時出錯
    # 我們加入 .get(p) 並過濾掉 None 的球員
    roster_ids = team_info.get("players", [])
    roster = [players.get(p) for p in roster_ids]
    roster = [p for p in roster if p is not None] # 過濾掉不存在的球員
    # ------------------

    return render_template("team.html", team_name=team_name, team=team_info, players=roster)


@app.route("/player/<player_id>")
def player_page(player_id):
    players = load_json("data/players.json")
    player = players.get(player_id, {})

    return render_template("player.html", player=player)

# --- 任務一：新增對戰模擬器 ---

@app.route("/matchup")
def matchup_page():
    """提供對戰模擬器的 '前端頁面'"""
    teams_data = load_json("data/teams.json")
    team_names = list(teams_data.keys())
    # 傳送隊伍名稱列表給 HTML，用於生成下拉選單
    return render_template("matchup.html", team_names=team_names)


@app.route("/api/predict", methods=["POST"])
def predict_matchup():
    """提供預測的 '後端 API'"""
    
    # 1. 取得前端傳來的 JSON 資料
    data = request.get_json()
    teamA_name = data.get("teamA")
    teamB_name = data.get("teamB")

    if not teamA_name or not teamB_name:
        return jsonify({"error": "Missing team names"}), 400

    # 2. 載入隊伍資料
    teams_data = load_json("data/teams.json")
    teamA_stats = teams_data.get(teamA_name, {}).get("team_stats")
    teamB_stats = teams_data.get(teamB_name, {}).get("team_stats")

    if not teamA_stats or not teamB_stats:
        return jsonify({"error": "Team data not found"}), 404

    # 3. 執行您的簡易預測模型 (來自您的藍圖)
    try:
        ops_a = teamA_stats['OPS']
        era_a = teamA_stats['ERA']
        ops_b = teamB_stats['OPS']
        era_b = teamB_stats['ERA']
        
        # 藍圖中的公式
        score_a = (ops_a * 1.2) - (era_b * 0.8)
        score_b = (ops_b * 1.2) - (era_a * 0.8)

        total_score = score_a + score_b
        
        # 避免除以零
        if total_score <= 0:
            prob_a = 0.5
        else:
            prob_a = round(score_a / total_score, 2)
        
        prob_b = round(1.0 - prob_a, 2)

        winner = teamA_name if prob_a > prob_b else teamB_name

        # 4. 回傳 JSON 格式的結果
        response = {
            "teamA": {"name": teamA_name, "win_probability": prob_a},
            "teamB": {"name": teamB_name, "win_probability": prob_b},
            "winner": winner
        }
        return jsonify(response)

    except KeyError:
        return jsonify({"error": "Team stats (OPS/ERA) missing"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ------------------------------

if __name__ == "__main__":
    app.run(debug=True)