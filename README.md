# Inscription LLM Editor

This repository contains tools for editing and validating epigraphic data extracted by LLM.

## Online Editor

Access the SPARQL-based editor here: [Gold Standard Editor (SPARQL)](https://your-username.github.io/inscription-editor/editor/gold_standard_editor_sparql.html)

## Contents

- **Lat-Epig-main/**: Scripts for scraping, processing, and converting epigraphic data to RDF
- **editor/**: Web-based tools for editing and validating gold standard data
  - `gold_standard_editor_sparql.html`: Main SPARQL-based editor with place selection
  - `editor_script_sparql_v2.js`: JavaScript for SPARQL editor

## Features

### SPARQL Editor
- Place-based inscription selection
- Direct connection to SPARQL endpoint (Dydra)
- Auto-complete options for ethnicity, divinity types, and position abstracts
- Real-time data validation
- JSON export for individual inscriptions

## Usage

1. Visit the [online editor](https://your-username.github.io/inscription-editor/editor/gold_standard_editor_sparql.html)
2. Select a place from the dropdown
3. Click "地名データ読込" to load inscriptions
4. Navigate through inscriptions using ◀ ▶ buttons
5. Edit and validate data
6. Export as JSON when complete

## SPARQL Endpoint

The editor connects to: `https://dydra.com/junjun7613/inscriptions_llm/sparql`

## License

See [LICENSE](Lat-Epig-main/LICENSE) for details.
