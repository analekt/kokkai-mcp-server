# kokkai-mcp-server

国会会議録検索システムと帝国議会会議録検索システムの API を自然言語で利用できる MCP サーバーです。

戦前の帝国議会から現在の国会まで、日本の議会記録をAIアシスタントから直接検索・取得できます。

## データソース

| システム | 対象期間 | API提供元 |
|---|---|---|
| [国会会議録検索システム](https://kokkai.ndl.go.jp/) | 1947年〜現在 | 国立国会図書館 |
| [帝国議会会議録検索システム](https://teikokugikai-i.ndl.go.jp/) | 1890年〜1947年 | 国立国会図書館 |

## セットアップ

### リモートサーバー（推奨）

Node.jsのインストールは不要です。URLを指定するだけで利用できます。

#### Claude Desktop（リモート）

`claude_desktop_config.json` に以下を追加してください。

```json
{
  "mcpServers": {
    "kokkai": {
      "type": "url",
      "url": "https://kokkai-mcp.vercel.app/api/mcp"
    }
  }
}
```

#### Claude Code（リモート）

```bash
claude mcp add kokkai --transport http https://kokkai-mcp.vercel.app/api/mcp
```

### ローカル実行

Node.js 18以上が必要です。

#### Claude Desktop（ローカル）

`claude_desktop_config.json` に以下を追加してください。

```json
{
  "mcpServers": {
    "kokkai": {
      "command": "npx",
      "args": ["-y", "kokkai-mcp-server"]
    }
  }
}
```

#### Claude Code（ローカル）

```bash
claude mcp add kokkai -- npx -y kokkai-mcp-server
```

### 手動ビルド

```bash
git clone https://github.com/analekt/kokkai-mcp-server.git
cd kokkai-mcp-server
npm install
npm run build
```

## ツール一覧

### 国会（1947年〜現在）

| ツール名 | 説明 |
|---|---|
| `search_kokkai_meetings` | 会議録を検索（本文なし、最大100件） |
| `get_kokkai_meeting` | 会議録を取得（全発言の本文付き、最大10件） |
| `search_kokkai_speeches` | 発言を検索（本文付き、最大100件） |

### 帝国議会（1890年〜1947年）

| ツール名 | 説明 |
|---|---|
| `search_teikoku_meetings` | 会議録を検索（本文なし、最大100件） |
| `get_teikoku_meeting` | 会議録を取得（全発言の本文付き、最大10件） |
| `search_teikoku_speeches` | 発言を検索（本文付き、最大100件） |

### 横断検索

| ツール名 | 説明 |
|---|---|
| `search_all_meetings` | 国会と帝国議会の両方から会議を横断検索 |
| `search_all_speeches` | 国会と帝国議会の両方から発言を横断検索 |

### 件数カウント

| ツール名 | 説明 |
|---|---|
| `count_kokkai` | 国会の検索結果件数を取得 |
| `count_teikoku` | 帝国議会の検索結果件数を取得 |
| `count_all` | 国会＋帝国議会の合計件数を横断で取得 |

### 全件取得

| ツール名 | 説明 |
|---|---|
| `get_all_kokkai_meetings` | 国会の会議録を全件取得（2秒間隔、最大2,500件） |
| `get_all_teikoku_meetings` | 帝国議会の会議録を全件取得（2秒間隔、最大2,500件） |

## 主要パラメータ

すべてのツールで共通して使用できる検索パラメータです。

| パラメータ | 説明 | 例 |
|---|---|---|
| `any` | 検索語（スペース区切りでAND検索） | `"人工知能 倫理"` |
| `speaker` | 発言者名（スペース区切りでOR検索） | `"田中 鈴木"` |
| `nameOfHouse` | 院名 | `"衆議院"`, `"参議院"`, `"貴族院"` |
| `nameOfMeeting` | 会議名（スペース区切りでOR検索） | `"予算委員会"` |
| `from` | 開会日付の始点 | `"2020-01-01"` |
| `until` | 開会日付の終点 | `"2020-12-31"` |
| `sessionFrom` / `sessionTo` | 回次の範囲 | `1`〜 |
| `maximumRecords` | 最大取得件数 | 会議一覧/発言: 1〜100、会議詳細: 1〜10 |
| `startRecord` | 取得開始位置（ページネーション） | `1`〜 |

### 国会のみのパラメータ

| パラメータ | 説明 |
|---|---|
| `closing` | 閉会中の会議を含める（デフォルト: false） |
| `speakerRole` | 発言者役割（`"証人"`, `"参考人"`, `"公述人"`） |

### 帝国議会のみのパラメータ

| パラメータ | 説明 |
|---|---|
| `speakerElection` | 発言者選出 |

## 使用例

### 「人工知能」に関する国会での発言件数を調べる

```
count_kokkai({ any: "人工知能", target: "speeches" })
```

### 戦前から現在まで「教育」に関する議論を横断検索する

```
search_all_speeches({ any: "教育", from: "1890-01-01", until: "2025-12-31" })
```

### 特定の議員の発言を検索する

```
search_kokkai_speeches({ speaker: "岸田文雄", from: "2021-10-01" })
```

### 予算委員会の会議録一覧を取得する

```
search_kokkai_meetings({ nameOfMeeting: "予算委員会", sessionFrom: 210 })
```

## 注意事項

- 本サーバーが利用するAPIは国立国会図書館が提供しています。短時間での大量アクセスはお控えください
- 全件取得ツールはリクエスト間に2秒の間隔を設けています。最大2,500件（25ページ）で打ち切られます
- 発言の著作権は個々の発言者に帰属します。利用にあたっては[国立国会図書館の利用規約](https://kokkai.ndl.go.jp/)をご確認ください
- 各ツールのレスポンスは JSON 形式です

## API ドキュメント

- [国会会議録検索システム API仕様](https://kokkai.ndl.go.jp/api.html)
- [帝国議会会議録検索システム API仕様](https://teikokugikai-i.ndl.go.jp/teikoku_api.html)

## ライセンス

MIT
