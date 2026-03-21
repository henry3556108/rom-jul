# R&J 組隊任務小幫手

開發者：吐司去邊先生（YiCheng Hung）
公會：MAYOIUTA

## Artale 羅密歐與茱麗葉組隊任務

這是一款多人開發給 Artale 的羅密歐與茱麗葉組隊任務的小工具，幫助玩家在 10 層樓、每層 4 扇門的場景中協作標記與追蹤各自的正確路線。
由於其他工具用了不太習慣，所以決定自己做一個出來 XD

## 功能

- **即時多人連線** — 基於 PeerJS (WebRTC P2P)，無需後端伺服器
- **房間系統** — 建立 / 加入房間，支援多組隊伍同時使用
- **門標記** — 左鍵標記自己的門，右鍵標記該門不是自己的
- **玩家顏色** — 每位玩家選擇專屬顏色，標記一目了然
- **提示系統** — 根據已知標記自動推理可能的門
- **房主管理** — 房主可踢除玩家

## 技術棧

- [Vue 3](https://vuejs.org/) + Composition API
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [PeerJS](https://peerjs.com/) (WebRTC)

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build
```

## 使用方式

1. 開啟網頁後，選擇 **建立房間** 或 **加入房間**
2. 設定你的名稱與顏色
3. 將房間連結分享給隊友
4. 所有人進入後即可開始協作標記

## License

本專案採用 **自訂授權條款**，詳見 [LICENSE](./LICENSE)。

- **非商業用途**：可自由使用、修改與散佈，標注原作者 (HongYi Cheng) 即可
- **商業用途**：須與原作者簽訂書面授權協議並進行**利潤分成**

如果喜歡可以幫我按一顆 Star，謝謝 XD

---

# Romeo & Juliet Helper (English)

Developer: 吐司去邊先生 (YiCheng Hung)
Guild: MAYOIUTA

## Romeo & Juliet Helper — MapleStory Worlds Artale

A real-time multiplayer tool for the Romeo & Juliet Stage 6 in [MapleStory Worlds Artale](https://maplestoryworlds.nexon.com/). It helps party members collaboratively mark and track each player's correct door across 10 floors, each with 4 doors.

Wasn't happy with the other tools out there, so I built my own :P

## Features

- **Real-time Multiplayer** — Peer-to-peer via PeerJS (WebRTC), no backend server needed
- **Room System** — Create or join rooms; multiple parties can use the tool simultaneously
- **Door Marking** — Left-click to confirm your correct door; right-click to exclude a door
- **Player Colors** — Each player picks a unique color for clear, at-a-glance tracking
- **Hint System** — Auto-deduces possible doors based on existing marks (cross-elimination & unique candidate)
- **Host Controls** — Room host can kick players and clear all marks

## Tech Stack

- [Vue 3](https://vuejs.org/) + Composition API
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [PeerJS](https://peerjs.com/) (WebRTC)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

## How to Use

1. Open the app and choose **Create Room** or **Join Room**
2. Set your name and pick a color
3. Share the room link with your party members
4. Once everyone is in, start marking doors together

## License

This project uses a **custom license** — see [LICENSE](./LICENSE) for details.

- **Non-commercial use**: Free to use, modify, and distribute with attribution to the original author (HongYi Cheng)
- **Commercial use**: Requires a written license agreement and **profit-sharing** with the original author

If you find this useful, a Star would be appreciated!
