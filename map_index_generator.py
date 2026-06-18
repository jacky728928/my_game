# -*- coding: utf-8 -*-
"""
地图列表自动生成脚本
运行此脚本扫描 地图/ 目录，自动生成 map_index.json
然后修改 ui.js 从网络加载地图列表
"""
import os
import json

# 获取脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))
maps_dir = os.path.join(script_dir, '地图')
output_file = os.path.join(script_dir, '地图', 'map_index.json')

def scan_maps():
    """扫描地图目录，返回地图列表"""
    maps = []

    if not os.path.exists(maps_dir):
        print(f"地图目录不存在: {maps_dir}")
        return maps

    for filename in os.listdir(maps_dir):
        # 只处理 .json 文件，排除 map_index.json 自身
        if filename.endswith('.json') and filename != 'map_index.json':
            filepath = os.path.join(maps_dir, filename)
            rel_path = os.path.join('地图', filename).replace('\\', '/')

            # 读取地图尺寸信息
            map_info = {
                'name': filename.replace('.json', ''),
                'path': rel_path,
                'walls': []  # 简化的墙体数据用于预览
            }
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # 尝试获取地图名称
                    if 'name' in data:
                        map_info['name'] = data['name']
                    # 尝试获取地图尺寸
                    if 'world' in data:
                        map_info['width'] = data['world'].get('width', 1600)
                        map_info['height'] = data['world'].get('height', 900)
                    # 墙体数量和简化数据（用于预览）
                    if 'walls' in data:
                        map_info['wallCount'] = len(data['walls'])
                        # 只保存墙体的位置和类型，用于渲染预览
                        for w in data['walls']:
                            map_info['walls'].append({
                                'x': w.get('x', 0),
                                'y': w.get('y', 0),
                                'w': w.get('w', 50),
                                'h': w.get('h', 50),
                                'type': w.get('type', 'mid')
                            })
                    # 玩家出生点
                    if 'playerSpawn' in data:
                        map_info['spawnX'] = data['playerSpawn'].get('x', 0)
                        map_info['spawnY'] = data['playerSpawn'].get('y', 0)
            except Exception as e:
                print(f"读取 {filename} 失败: {e}")

            maps.append(map_info)
            print(f"发现地图: {map_info['name']} ({rel_path})")

    return maps

def update_ui_js():
    """更新 ui.js 中的 MAP_LIST 为空数组（使用动态加载）"""
    ui_js_path = os.path.join(script_dir, 'js', 'ui.js')

    if not os.path.exists(ui_js_path):
        print(f"ui.js 不存在，跳过更新")
        return

    with open(ui_js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 替换 MAP_LIST 定义为空数组（使用动态加载）
    old_pattern = '''// 地图列表（这里硬编码是因为无法直接访问文件系统，实际使用时可通过fetch获取目录）
const MAP_LIST = [
  { name: '默认地图', path: '地图/map_data.json' },
  // 可在此添加更多地图路径
];'''

    new_pattern = '''// 地图列表（由 Python 脚本自动生成）
// 运行: python map_index_generator.py
const MAP_LIST = []; // 动态加载，见 loadMapList()

// 地图列表加载器（自动从 map_index.json 读取）
async function loadMapList() {
  try {
    const res = await fetch('地图/map_index.json');
    if (res.ok) {
      const data = await res.json();
      MAP_LIST.length = 0;
      MAP_LIST.push(...data);
    }
  } catch (e) {
    console.warn('无法加载地图列表:', e);
  }
}'''

    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(ui_js_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("已更新 ui.js")
    else:
        print("未找到旧的 MAP_LIST 定义，跳过更新 ui.js")

def main():
    print("=" * 40)
    print("地图列表自动生成器")
    print("=" * 40)

    # 扫描地图
    maps = scan_maps()

    if not maps:
        print("\n未发现任何地图文件")
        maps = []

    # 生成 map_index.json
    output_data = {
        'generated': True,
        'count': len(maps),
        'maps': maps
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n已生成: {output_file}")
    print(f"共 {len(maps)} 个地图")

    # 询问是否更新 ui.js
    print("\n是否更新 ui.js? (需要本地服务器支持 fetch)")
    update_ui_js()

if __name__ == '__main__':
    main()
