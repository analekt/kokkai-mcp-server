# kokkai-mcp-server

国会会議録検索システムと帝国議会会議録検索システムの API を自然言語で利用できる MCP サーバーです。

戦前の帝国議会から現在の国会まで、日本の議会記録をAIアシスタントから直接検索・取得できます。

## データソース

| システム | 対象期間 | API提供元 |
|---|---|---|
| [国会会議録検索システム](https://kokkai.ndl.go.jp/) | 1947年〜現在 | 国立国会図書館 |
| [帝国議会会議録検索システム](https://teikokugikai-i.ndl.go.jp/) | 1890年〜1947年 | 国立国会図書館 |

## セットアップ

Node.jsのインストールは不要です。URLを指定するだけで利用できます。

### Claude Desktop

`claude_desktop_config.json` に以下を追加してください。

```json
{
  "mcpServers": {
    "kokkai": {
      "type": "url",
      "url": "https://kokkai.vercel.app/mcp"
    }
  }
}
```

### Claude Code

```bash
claude mcp add kokkai --transport http https://kokkai.vercel.app/mcp
```

## ツール一覧

### 国会（1947年〜現在）

| ツール名 | 説明 |
|---|---|
| `search_kokkai_meetings` | 会議録を検索（本文なし、最大100件） |
| `get_kokkai_meeting` | 会議録を取得（全発言の本文付き、最大10件） |
| `search_kokkai_speeches` | 発言を検索（本文付き、最大100件） |
| `get_kokkai_speech` | 発言を speechID で1件取得（本文付き） |

### 帝国議会（1890年〜1947年）

| ツール名 | 説明 |
|---|---|
| `search_teikoku_meetings` | 会議録を検索（本文なし、最大100件） |
| `get_teikoku_meeting` | 会議録を取得（全発言の本文付き、最大10件） |
| `search_teikoku_speeches` | 発言を検索（本文付き、最大100件） |
| `get_teikoku_speech` | 発言を speechID で1件取得（本文付き） |

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
| `get_all_kokkai_meetings` | 国会の会議録をヒット全件取得（2秒間隔でページネーション） |
| `get_all_teikoku_meetings` | 帝国議会の会議録をヒット全件取得（2秒間隔でページネーション） |

## 推奨ワークフロー

発言本文は1件あたりのデータ量が大きく、大量に取得するとAIのコンテキストを圧迫します。次の段階的な手順を推奨します（この内容はサーバーの `instructions` としてもAIに伝えられます）。

1. まず `count_kokkai` / `count_teikoku` / `count_all` で件数を把握する
2. 件数が多い場合は `search_*_meetings`（本文なしのメタデータ）で会議を絞り込む
3. 必要な会議のみ `get_*_meeting` で全発言本文を取得する
4. 特定の発言だけ読みたい場合は、`search_*_speeches` で見つけた `speechID` を `get_*_speech` に渡してピンポイントで取得する

戦前から現在までを横断的に調べたいときは `search_all_meetings` / `search_all_speeches` / `count_all` を使います。

## 主要パラメータ

検索系の各ツールで共通して使用できる検索パラメータです。

| パラメータ | 説明 | 例 |
|---|---|---|
| `any` | 検索語（スペース区切りでAND検索） | `"人工知能 倫理"` |
| `speaker` | 発言者名（スペース区切りでOR検索） | `"田中 鈴木"` |
| `nameOfHouse` | 院名 | `"衆議院"`, `"参議院"`, `"貴族院"` |
| `nameOfMeeting` | 会議名（スペース区切りでOR検索） | `"予算委員会"` |
| `from` | 開会日付の始点（YYYY-MM-DD） | `"2020-01-01"` |
| `until` | 開会日付の終点（YYYY-MM-DD） | `"2020-12-31"` |
| `sessionFrom` / `sessionTo` | 回次の範囲 | `1`〜 |
| `issueFrom` / `issueTo` | 号数の範囲 | `1`〜 |
| `startRecord` | 取得開始位置（ページネーション、デフォルト: 1） | `1`〜 |
| `searchRange` | 検索範囲（`"冒頭"` / `"本文"` / `"冒頭・本文"` のいずれか。デフォルト: 冒頭・本文） | `"本文"` |
| `supplementAndAppendix` | 追録・附録を検索対象に含める（デフォルト: false） | `true` |
| `contentsAndIndex` | 目次・索引を検索対象に含める（デフォルト: false） | `true` |
| `speechNumber` | 発言番号（完全一致） | `0`〜 |
| `speakerPosition` | 発言者肩書き | `"内閣総理大臣"` |
| `speakerGroup` | 発言者所属会派 | `"自由民主党"` |
| `speechID` | 発言ID（完全一致） | |
| `issueID` | 会議録ID（完全一致） | |

### `maximumRecords`（最大取得件数）

検索系ツールのみで指定できます。**カウント系（`count_*`）・全件取得系（`get_all_*`）では指定できません**（カウント系は内部で1件のみ取得、全件取得系はページネーションで自動取得するため）。

| ツール種別 | 範囲 | デフォルト |
|---|---|---|
| 会議録一覧（`search_*_meetings`）/ 発言検索（`search_*_speeches`）/ 横断検索（`search_all_*`） | 1〜100 | 30 |
| 会議録取得（`get_*_meeting`） | 1〜10 | 3 |

### `target`（カウント系のみ・必須）

`count_kokkai` / `count_teikoku` / `count_all` で**必須**のパラメータです。

| 値 | 対象 |
|---|---|
| `"meetings"` | 会議のカウント |
| `"speeches"` | 発言のカウント |

### 国会のみのパラメータ

| パラメータ | 説明 |
|---|---|
| `closing` | 閉会中の会議を検索対象に含める（デフォルト: false） |
| `speakerRole` | 発言者役割（`"証人"` / `"参考人"` / `"公述人"` のいずれか） |

※横断検索（`search_all_*`）・横断カウント（`count_all`）では使用できません。

### 帝国議会のみのパラメータ

| パラメータ | 説明 |
|---|---|
| `speakerElection` | 発言者選出 |

※横断検索（`search_all_*`）・横断カウント（`count_all`）では使用できません。

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

### 検索でヒットした特定の発言の全文を取得する

```
get_kokkai_speech({ speechID: "122105367X00720260514_006" })
```

## 注意事項

- 本サーバーが利用するAPIは国立国会図書館が提供しています。短時間での大量アクセスはお控えください
- 全件取得ツール・横断ツールは、国立国会図書館への負荷軽減のためリクエスト間に2秒の間隔を設けています。全件取得はヒットした件数をすべて取得するため、件数が多い場合は時間がかかります
- **NDL APIのレスポンスは最大1時間キャッシュされます。** 会期中の最新データを確認したい場合など、より新鮮なデータが必要な場合は時間をおいて再試行してください
- 発言の著作権は個々の発言者に帰属します。利用にあたっては[国立国会図書館の利用規約](https://kokkai.ndl.go.jp/)をご確認ください
- 各ツールのレスポンスは JSON 形式です

## 環境変数（自前デプロイ時）

Vercel などにセルフホストする場合、以下の環境変数でキャッシュ動作を調整できます。

| 環境変数 | デフォルト | 説明 |
|---|---|---|
| `CACHE_TTL_MS` | `3600000`（1時間） | キャッシュの有効期間（ミリ秒）。会期中の最新データを重視する場合は短く設定 |
| `CACHE_MAX_SIZE` | `200` | キャッシュの最大エントリ数。超過した場合は最も長く未使用のエントリを削除 |

## API ドキュメント

- [国会会議録検索システム API仕様](https://kokkai.ndl.go.jp/api.html)
- [帝国議会会議録検索システム API仕様](https://teikokugikai-i.ndl.go.jp/teikoku_api.html)

## ライセンス

MIT
