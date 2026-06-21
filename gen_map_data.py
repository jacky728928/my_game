import os
import json

MAP_DIR = r"d:\Program Files\python work\游戏最新（自己）\地图"
OUT_FILE = r"d:\Program Files\python work\游戏最新（自己）\js\map_data.js"

index_path = os.path.join(MAP_DIR, "map_index.json")
maps = []
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for m in data.get("maps", []):
        maps.append({
            "name": m.get("name", "未命名地图"),
            "world": {
                "width": m.get("width", m.get("world", {}).get("width", 1600)),
                "height": m.get("height", m.get("world", {}).get("height", 900)),
            },
            "playerSpawn": {
                "x": m.get("spawnX", m.get("playerSpawn", {}).get("x", 800)),
                "y": m.get("spawnY", m.get("playerSpawn", {}).get("y", 450)),
            },
            "walls": m.get("walls", []),
        })

seen_names = {m["name"] for m in maps}
for fn in sorted(os.listdir(MAP_DIR)):
    if not fn.endswith(".json") or fn == "map_index.json":
        continue
    path = os.path.join(MAP_DIR, fn)
    try:
        with open(path, "r", encoding="utf-8") as f:
            md = json.load(f)
    except Exception:
        continue
    name = md.get("name", fn.replace(".json", ""))
    if name in seen_names:
        continue
    if "world" in md and "walls" in md:
        maps.append({
            "name": name,
            "world": md["world"],
            "playerSpawn": md.get("playerSpawn", {
                "x": md["world"]["width"] / 2,
                "y": md["world"]["height"] / 2,
            }),
            "walls": md["walls"],
        })
        seen_names.add(name)

with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write("// 自动生成：内联地图数据，避免 file:// 协议下 fetch 失败\n")
    f.write("// 重新生成：运行 gen_map_data.py 或 map_index_generator.py\n")
    f.write("window.MAP_INDEX_DATA = ")
    json.dump(maps, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print("OK:", len(maps), "maps ->", OUT_FILE)
for m in maps:
    print(" -", m["name"], ":", str(m["world"]["width"]) + "x" + str(m["world"]["height"]), str(len(m["walls"])) + " walls")
