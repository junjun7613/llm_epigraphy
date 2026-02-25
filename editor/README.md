# Gold Standard Editor

碑文のLLM抽出データを検証・修正するための手動アノテーションツールです。

## 概要

このエディターは、filtered_data内のJSONファイル（碑文の配列）を読み込み、専門家が手動でgold standardデータを作成するためのWebインターフェイスです。

## ファイル構成

```
editor/
├── gold_standard_editor.html   # メインHTMLファイル
├── editor_script.js             # JavaScript（ページ送り機能付き）
├── generate_editor.py           # HTMLファイル生成スクリプト
├── generate_js.py               # JavaScriptファイル生成スクリプト
├── gold_standard_editor_backup.html  # バックアップ
├── editor_script_template.txt   # テンプレート
└── README.md                    # このファイル
```

## 使い方

### 1. エディターを開く

```bash
# ブラウザでHTMLファイルを開く
open editor/gold_standard_editor.html
```

または、ブラウザで直接 `editor/gold_standard_editor.html` を開きます。

### 2. JSONファイルを読み込む

1. 「JSON読込」ボタンをクリック
2. `filtered_data` 内の都市別フォルダからJSONファイルを選択
   - 例: `filtered_data/Cirta/2025-12-20-EDCS_via_Lat_Epig-place_Cirta-1701.json`

### 3. 碑文を編集

- **左パネル**: 碑文テキストとメタデータを表示
- **右パネル**: 構造化データ入力フォーム
- **◀ 前へ / 次へ ▶ ボタン**: ページ送りで碑文を移動
- **ページ情報**: 「3 / 137」のように現在位置と総数を表示

### 4. データ入力

以下の情報を入力できます：

#### 人物 (Persons)
- **基本情報**: Tria nomina (praenomen, nomen, cognomen)
- **社会的身分**: emperor, senator, equestrian, decurio, freedman, slave, etc.
- **性別**: male, female, unknown
- **民族性**: ethnicity
- **享年**: age_at_death

#### 経歴 (Career Path)
- **職位**: 原文、正規化形、抽象形
- **職位タイプ**: military, imperial-administration, local-administration, priesthood, etc.
- **順序**: 昇進順序

#### 恵与行為 (Benefactions)
- **恵与タイプ**: construction, repair, donation, games, feast
- **対象物**: ラテン語形式
- **費用**: cost
- **根拠テキスト**: 碑文中の証拠

#### コミュニティ (Communities)
- **名称**: 正規化形
- **タイプ**: legion, cohort, city, municipium, colonia, collegium, ordo
- **説明**: 英語での説明

#### 関係性 (Relationships)
- **タイプ**: family, colleague, patronage, dedication, economic, affiliation
- **起点と対象**: 人物IDまたはコミュニティID
- **プロパティ**: father, member, soldier, etc.

### 5. データ保存

- **保存ボタン**: 現在の碑文データを一時保存（ブラウザメモリ内）
- **JSON出力ボタン**: 現在表示中の碑文のgold_standardデータのみをJSONファイルとしてエクスポート
  - ファイル名: `gold_standard_EDCS-ID.json`（例: `gold_standard_EDCS-08100178.json`）

## データ構造

エクスポートされるJSONは、gold_standardデータのみです：

```json
{
  "edcs_id": "EDCS-08100178",
  "persons": [
    {
      "person_id": 0,
      "person_name": "Q. Antistius Adventus Postumius Aquilinus",
      "praenomen": "Quintus",
      "nomen": "Antistius",
      "cognomen": "Adventus",
      "social_status": "senator-clarissimus",
      "gender": "male",
      "has_career": true,
      "career_path": [
        {
          "position": "consul",
          "position_normalized": "consul",
          "position_abstract": "consul",
          "position_type": "imperial-administration",
          "order": 1
        }
      ],
      "benefactions": []
    }
  ],
  "communities": [],
  "person_relationships": [],
  "notes": ""
}
```

このデータは `extract_career_graph.py` の出力データ構造と同じ形式です。

## 機能詳細

### ページ送り機能
- 前の碑文へ移動時、現在の編集データを自動保存
- 次の碑文へ移動時、現在の編集データを自動保存
- 各碑文に `gold_standard` フィールドとして編集データを保持

### データバリデーション
- 人物ID、コミュニティIDは自動採番
- 関係性のtypeに応じて、対象が人物またはコミュニティに自動切り替え
- 経歴の順序は自動的に連番を提案

### UI/UX
- 左右2カラムレイアウト
- カードベースの編集フォーム
- ネストした構造（経歴、恵与行為）
- ドロップダウンによる統制語彙選択
- ボタンによる追加・削除操作

## ワークフロー例

1. filtered_data内のJSONファイルを読み込む（例: Cirtaの1701件）
2. 1件目から順番に碑文テキストを読む
3. 碑文から人物名、職位、恵与行為などを抽出して入力
4. 「JSON出力」ボタンで現在の碑文のgold_standardデータをエクスポート
   - ファイル名: `gold_standard_EDCS-ID.json`
5. 「次へ」ボタンで次の碑文へ（自動保存）
6. 手順3-5を繰り返して、必要な碑文のgold standardデータを作成
7. エクスポートしたJSONファイルをLLM抽出結果（`career_graphs/`内）と比較して精度評価

## 注意事項

- 各碑文の編集が終わったら、必ず「JSON出力」でデータをエクスポートしてください
- 「保存」ボタンは現在の碑文のみを一時保存します（ブラウザメモリ内）
- エクスポートしたJSONファイルは碑文ごとに個別のファイルとして保存されます
- ファイル名には碑文のEDCS IDが含まれるため、管理が容易です

## ファイル生成

HTMLとJavaScriptファイルは以下のスクリプトで再生成できます：

```bash
cd editor
python3 generate_editor.py  # gold_standard_editor.html を生成
python3 generate_js.py       # editor_script.js を生成
```

## 対応ブラウザ

- Google Chrome (推奨)
- Safari
- Firefox
- Edge

モダンブラウザであれば動作します。
