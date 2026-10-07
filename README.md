# LaunchDNA · IGNIX 发币品牌工坊

## English overview

LaunchDNA helps creators prepare a brand before launching a project on [IGNIX](https://ignix.bot/). Enter a project idea, choose a direction, tone, and intended vault template, then review three editable names, tickers, and descriptions. The selected concept produces a reproducible circuit-generated logo that can be downloaded as PNG or SVG, together with a JSON launch pack. [Try the public demo](https://launchdna-brand-processor.ccawaa.chatgpt.site/).

The visual engine is a real TapeOut circuit on X Layer. We deployed LaunchDNA Brand Processor through the TapeOut factory with a 100,000-transistor cap and a price of 0.00001 OKB per NAND. We minted and consumed 232 NAND gates to tape out Circuit NFT #1, which maps 22 input bits to 20 output bits. The demo's **Verify with onchain circuit** action performs a read-only `eval` against the deployed processor and compares every output bit with the browser result. The circuit and transaction identifiers appear below and in [`onchain-deployment.json`](onchain-deployment.json).

The first version uses a local wordbank for name suggestions; it does not use an online AI model. The site does not launch tokens, sign wallet transactions, custody funds, guarantee trademark clearance, or promise vault returns. A possible future IGNIX Genesis Transistor vault could fund verified brand templates and new circuit work from opt-in launches, subject to rules set and implemented by IGNIX; no such vault is live in this project.

For a local run, use `npm ci`, `npm run build`, `npm run check`, then `node scripts/serve-worker.cjs`. The generated `dist/circuit.json` includes the complete netlist and test vectors. The source repository omits Sites hosting credentials and local runtime files.

LaunchDNA 是一个面向 IGNIX 创建者的品牌准备工具。用户描述应用或 Meme，选择项目方向、风格和准备采用的金库，得到三套可编辑的名称、Ticker 与简介，以及可下载的 Logo 和发币资料。

## 产品闭环

1. 输入设想。首版名称由本地场景词库生成，没有调用在线 AI 模型。
2. 选择候选。每套方案从设想和风格得到 16 位种子，再与方向、情绪、金库类型组成 22 位电路输入。
3. 已流片的电路 NFT #1 输出 20 位：前 16 位为 4×4 象限，镜像形成 8×8 标志；后 4 位决定配色。浏览器执行同一套 NAND 规则。用户可按按钮通过 X Layer RPC 调用链上 `eval`，逐位比较当前 Logo。
4. 下载 PNG、SVG 和 JSON 发币资料。下载由站点即时返回，站点不保存输入。用户在 [IGNIX 发币页](https://ignix.bot/create?template=0)自行填写、核对并部署。
5. 名称/Ticker 同名检查查询 IGNIX 只读 API 的前五页，仅辅助发现完全一致的名称，不保证全量覆盖或商标权。

## 处理器与电路

| 项目 | 方案 |
| --- | --- |
| 链 | X Layer，chainId 196 |
| 处理器名 / 符号 | LaunchDNA Brand Processor / LDNA |
| 工厂 | `0x1f09daefa827f02cbb40967cc91b259763760761` |
| 处理器 / 电路合约 | `0xDc867bFAf8e053d3F382B487c87B3E0F9B9Bb670` |
| 晶体管合约 | `0x2fE41321a35e96e14a9Db0818E9b9CA691214615` |
| 创建交易 | `0xa3264db68797040160db69a02bfcb95e6d0b3f0600d3d862c0993fa584f45478` |
| 铸造交易 | `0xbdb0c1d7e2d59781d183f46e1de7010514524d5a2638c7b192d8d8e1e2729332` |
| 流片交易 | `0xd5e243ee5ea5c428b624a18aa51af807a72275b2179aaa7e5319c895b993e319` |
| 晶体管供应上限 | 100,000 |
| NAND 铸造单价 | 0.00001 OKB |
| 首个电路 | NFT #1；232 NAND，22 输入，20 输出，1624 字节 |
| 网表 SHA-256 | `0x4f387983befd9d96e4869a89ad1dba9962406abd6977ba9cfb815a2e259805c3` |
| 当前状态 | 处理器与电路 NFT #1 已在 X Layer 主网创建；232 枚 NAND 已铸造并在流片时消耗 |

流片时，电路设计者需要铸造并消耗相应晶体管。用户复用已流片电路生成品牌时无需再次铸造。Circuit NFT 能证明电路逻辑的来源与结构；它不授予名称或 Logo 的商标独占，也不证明项目质量。未来 IGNIX 专属金库规则尚未公布，本产品不假设收益或分成。

## 费用核对

2026-10-07，主网三步均已确认：创建处理器 0.0066 OKB、铸造 232 枚 NAND 0.00298 OKB（含协议费）、流片 0.0013 OKB，合计 0.01088 OKB。流片后钱包 NAND 余额为 0，电路数量为 1，电路 NFT #1 属于创建钱包。两条 X Layer RPC 均确认 NFT 属性及仓库中的四组测试向量。站点的链上核验入口是只读调用；RPC 不可用时会明确提示，不会将本地结果冒充链上结果。

## 本地验证

```sh
npm install
npm run build
npm run check
```

`scripts/circuit.test.cjs` 从编码后的网表独立执行所有 65,536 个基础种子和 4,096 个混合输入，核对浏览器电路输出。`scripts/worker.test.mjs` 验证下载、资料包和 ABI 兼容的只读链上计算接口。独立的真实 RPC 调用也已将默认品牌输入的链上输出与本地输出对齐。

只读主网预检：

```sh
npm run prepare-mainnet -- --deployer <public X Layer address> --output deployment-review.json
```

Windows 上经 HTTP 代理访问 RPC 时可设置 `NODE_USE_ENV_PROXY=1`。预检会检查两节点链 ID、工厂代码与费用、钱包余额，并对拟议 `createCPU` 调用进行 `eth_call` 和 Gas 估算；**不签名或广播交易**。`deployment-review.json` 在 `.gitignore` 中，不会作为站点文件发布。

创建交易可用 `node scripts/verify-creation.mjs --tx <transaction hash> --creator <public X Layer address> --output .sites-runtime/creation-report.json` 复核。脚本从工厂事件定位合约地址，并在两条 RPC 上比对供应量、单价、创建者及当前铸造和流片费用。该检查只读，不会发送后续交易。

流片交易可用 `node scripts/verify-tapeout.mjs --tx <transaction hash> --processor <processor address> --author <public X Layer address> --output .sites-runtime/tapeout-report.json` 复核。脚本检查流片事件、NFT 所有者、门数量与输入输出位数，再将四组测试向量交给链上 `eval` 计算。公开部署信息汇总在 `onchain-deployment.json`。

## 参考

- [IGNIX 创建代币文档](https://ignix.bot/docs/launching-a-token)
- [IGNIX 黑客松规则](https://ignix.bot/x_campaign)
- [TapeOut 白皮书](https://tapeout.net/whitepaper)
