# Data Report Schema v1.0.0

`reports/data_report.json`:

- `schemaVersion`: string
- `generatedAt`: ISO datetime string
- `quality`:
  - `totals`: `{ error, warning, info }`
  - `issuesByCollection`: map `<collection, { error, warning, info }>`
  - `topRules`: array of `{ rule, count }`
- `content`:
  - `totals`: `{ spells, schools }`
  - `spellsBySchool`: array of `{ school, count }`
  - `concentrationShare`: number (0-100)
  - `subspellShare`: number (0-100)
  - `incompleteObjects`: number
  - `schoolsWithoutSpells`: number
  - `relationDensityAvg`: number
- `dice`:
  - `status`: `ok | insufficient_data`
  - `reason`: nullable string
  - `rollsCountByDiceType`: map `<diceType, count>`
  - `avgResultByDiceType`: map `<diceType, number>`
  - `theoreticalAvgByDiceType`: map `<diceType, number>`
  - `avgDeltaFromTheoretical`: map `<diceType, number>`
  - `critFailRate`: map `<diceType, number>`
  - `critSuccessRate`: map `<diceType, number>`
  - `userAvgVsGlobal`: array of `{ userId, userDisplayName, diceType, userAvg, globalAvg, delta, rollsCount }`
  - `userSummaries`: array of `{ userId, userDisplayName, rollsCount, lastRollAt, avgResult, avgDeltaFromTheoretical, critFailCount, critSuccessCount, critFailRate, critSuccessRate }`
  - `rollTypeStats`: array of `{ rollTypeKey, label, context, diceType, expression, count, share, avg, theoreticalAvg, delta, critFailRate, critSuccessRate }`
  - `topRollType`: nullable object c полями как у элемента `rollTypeStats`
