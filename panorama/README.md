# 持仓全景图 `/panorama/`

线上地址：<https://jiah558.github.io/us-stock-ai-radar/panorama/>

纯静态页面（无构建、无第三方 JS/CDN），复用站点的 Morandi 色板（`assets/app.css`，红涨绿跌，自动深色模式）。

| 区块 | 说明 |
|---|---|
| 市场趋势 | 标普 500 / 纳斯达克 100 / 道琼斯：现价、当日、本周 / 本月 / 今年 % |
| 概览卡片 | 持仓加权当日涨跌、涨跌家数、领涨、领跌 |
| 持仓地图 | Treemap，面积 = 占比，块内显示代码、当日 %、占比、现价、盘前/盘后价；下方同步一份列表（手机上更好读） |
| 板块涨跌 | 14 只板块 / 商品 ETF（XLK SMH XLC XLY XLV XLP XLE XLF XLI XLU XLB XLRE GLD SLV）当日涨跌，左绿右红的双向条 |
| 顶部状态 | 盘前 / 盘中 / 盘后 / 休市（按美东时间 + 美股假日表判断），数据时间（美东 + 北京时间） |

## 实时更新怎么做的
GitHub Pages 是静态托管，浏览器直连 Yahoo 会被 CORS 拦截，所以：

1. `.github/workflows/panorama-quotes.yml` 定时运行 `tools/fetch_quotes.py`（与站点日报同一数据源：Yahoo Finance chart API，无需 key）。
   - 美股交易时段每 5 分钟一次；盘前 / 盘后 / 休市约每 30 分钟检查一次（脚本自己判断是否需要拉取，休市且数据未变则不写入）。
   - GitHub 的 cron 有排队延迟（常见延后 3–15 分钟），所以实际间隔是“约 5–15 分钟”。
2. 结果写到**孤儿分支 `quotes-data`**（强制覆盖成单个提交，不产生历史、不触发 Pages 重新构建、不污染 `main`）。
3. 页面每 60 秒轮询 `raw.githubusercontent.com/.../quotes-data/quotes.json`（CORS `*`），同时读取同源的 `data/quotes.json`（收盘快照，作为兜底/离线），取较新的一份。
4. `main` 上只在**休市时**提交一次 `data/quotes.json` 收盘快照（每个交易日约 1 个提交），不影响原有的 `tools/daily_update.sh` 流程。

如需立即刷新：GitHub → Actions → `panorama-quotes` → Run workflow。本地手动：`python3 tools/fetch_quotes.py`。

> Yahoo 对请求头较敏感：请保持 `User-Agent: Mozilla/5.0`（与 `fetch_prices.py` 一致），过长的浏览器 UA 反而会被 429。

## ⚠ 占比是占位数据
`data/panorama-weights.json` 目前是 **7 只等权（各 14.3%）的示例**，页面会显示「示例占比」徽章（`"placeholder": true` 时）。

### 换成真实占比
编辑 `data/panorama-weights.json`：

```json
{
  "placeholder": false,
  "showWeights": true,
  "weights": { "IREN": 30, "SPCX": 20, "NBIS": 15, "MU": 15, "LUNL": 5, "RKLX": 5, "RKLB": 10 }
}
```

- `weights` 里的数字只是**相对比例**，会自动归一化成 100%（可以直接写百分比，合计不必等于 100）。
- 把 `placeholder` 改为 `false` 即可去掉「示例占比」徽章。
- `showWeights: false` = 默认隐藏占比（Treemap 改为等分面积，占比文字全部不显示）；访问者也可用页面上的「显示占比」开关临时切换（记在本机 localStorage）。
- **只写百分比。不要在仓库里放股数、成本价、盈亏** —— 页面与数据文件都不会也不应该包含这些。
- 提交并 push 到 `main` 后约 1 分钟生效。

## 其它
- 增删标的 / 板块 ETF：改 `tools/fetch_quotes.py` 顶部的 `HOLDINGS / INDICES / SECTORS`，以及 `panorama/panorama.js` 里的 `NAMES`。
- 截图 / 控制台检查：`python tools/shot_panorama.py --prefix local-`（需要 playwright + 系统 Chrome）。
