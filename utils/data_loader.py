import json
import os


def load_json(path):
    path = os.path.join(os.getcwd(), path)
    with open(path, encoding="utf-8") as f:
        return json.load(f)
