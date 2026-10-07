(() => {
  "use strict";
  const circuit = window.LaunchDNACircuit;
  const $ = (id) => document.getElementById(id);
  const palette = [
    ["#141a2b", "#d6ff62", "#7e5ef9"], ["#161425", "#f5a8ff", "#a376ff"],
    ["#102336", "#7be3ff", "#58a6ff"], ["#132925", "#96ffd9", "#45b989"],
    ["#282017", "#ffd18c", "#ff8a57"], ["#241923", "#ff9aa5", "#ce5c9f"],
    ["#111f30", "#a8d5ff", "#ffc37a"], ["#142529", "#b6ffca", "#70bfff"],
    ["#242014", "#ffe466", "#ff9a4f"], ["#1c1931", "#cdb5ff", "#92ecff"],
    ["#182026", "#efeff2", "#a9edc2"], ["#291a22", "#ffd2dd", "#ff7791"],
    ["#162427", "#f4ffa8", "#72dbd0"], ["#221b31", "#fbacff", "#ffa95e"],
    ["#1c2530", "#d3e2ff", "#8295ff"], ["#202020", "#f5f5ee", "#d6ff62"],
  ];
  const roots = [
    ["Agent", "Mind", "Prompt", "Logic", "Neuron", "Pilot"],
    ["Flux", "Pay", "Vault", "Mint", "Flow", "Pulse"],
    ["Pixel", "Quest", "Guild", "Arcade", "Loot", "Play"],
    ["Meme", "Vibe", "Neko", "Bunny", "Paw", "Wave"],
  ];
  const tails = [
    ["Pilot", "Mind", "Agent", "Lab", "Spark", "Loop"],
    ["Pay", "Flow", "Mint", "Vault", "Swap", "Loop"],
    ["Quest", "Guild", "Play", "Arc", "Land", "Loop"],
    ["Pop", "Club", "Wave", "Paw", "Verse", "Loop"],
  ];
  const modifiers = [
    ["Neon", "Nova", "Quantum", "Cyber", "Orbit", "Nexa"],
    ["Pop", "Mochi", "Bop", "Wink", "Bouncy", "Jolly"],
    ["Luma", "Mono", "Pure", "Mira", "Arc", "Sola"],
    ["Volt", "Blaze", "Hyper", "Riot", "Turbo", "Raze"],
  ];
  const domainLabels = ["AI 与工具", "支付与 DeFi", "游戏与社区", "Meme 与文化"];
  const moodLabels = ["未来科技", "轻松有趣", "简洁克制", "大胆有力"];
  const vaultLabels = ["系统金库", "币股金库", "税收分配金库", "定向金库"];
  const motifs = [
    [/猫|cat|neko|喵/i, "Paw"], [/狗|dog|doge|柴犬/i, "Doge"],
    [/狐狸|fox/i, "Fox"], [/熊猫|panda/i, "Panda"],
    [/龙|dragon/i, "Drake"], [/兔|rabbit|bunny/i, "Bunny"],
    [/闪电|电光|lightning|bolt/i, "Bolt"], [/火|fire|flame/i, "Flare"],
    [/月亮|moon|luna/i, "Luna"], [/星|star|cosmo/i, "Star"],
    [/火箭|rocket/i, "Rocket"], [/咖啡|coffee/i, "Brew"],
    [/音乐|music|song/i, "Beat"], [/像素|pixel/i, "Pixel"],
    [/游戏|game|quest/i, "Quest"], [/支付|pay/i, "Pay"],
  ];
  const defaultMotif = ["Spark", "Flow", "Quest", "Vibe"];
  const state = { candidates: [], selected: 0, artifact: null, brief: "", domain: 0, mood: 0, vault: 0, verifyRequest: 0 };

  function hash32(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function inferDomain(brief) {
    if (/\bAI\b|智能|代理|agent|机器人|模型|推理|大模型/i.test(brief)) return 0;
    if (/支付|交易|金融|DeFi|收益|金库|钱包|swap|pay|trade|stablecoin/i.test(brief)) return 1;
    if (/游戏|链游|公会|玩家|竞技|社区|像素|game|quest|guild|pixel/i.test(brief)) return 2;
    return 3;
  }

  function inferMood(brief) {
    if (/轻松|可爱|有趣|萌|欢乐|fun|cute|playful/i.test(brief)) return 1;
    if (/极简|简洁|克制|纯粹|minimal|clean/i.test(brief)) return 2;
    if (/大胆|狂野|力量|爆发|战斗|bold|power/i.test(brief)) return 3;
    return 0;
  }

  function motifFromBrief(brief, domain) {
    return motifs.find(([regex]) => regex.test(brief))?.[1] || defaultMotif[domain];
  }

  function caseName(a, b) {
    const name = a === b ? `${a}X` : `${a}${b}`;
    return name.slice(0, 24);
  }

  function ticker(a, b, index) {
    const value = index === 0 ? a[0] + b.slice(0, 4)
      : index === 1 ? a.slice(0, 2) + b.slice(0, 3)
      : a.slice(0, 3) + b.slice(0, 2);
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  }

  function formatDescription(name, brief) {
    const idea = brief.trim().replace(/[。.!！]+$/, "");
    return `${name} 以“${idea}”为创作设想，面向 X Layer 社区打造品牌与应用体验。`;
  }

  function generateCandidates(brief, domain, mood, vault) {
    const h = hash32(brief);
    const motif = motifFromBrief(brief, domain);
    const picks = [
      [modifiers[mood][h % 6], motif],
      [roots[domain][(h >>> 4) % 6], motif],
      [motif, tails[domain][(h >>> 9) % 6]],
    ];
    const seen = new Set();
    return picks.map(([left, right], index) => {
      let name = caseName(left, right);
      if (seen.has(name)) name = caseName(left, tails[domain][(h + index + 1) % 6]);
      seen.add(name);
      const seed = hash32(`${brief}|${index}|${name}`) & 65535;
      const input = circuit.packInputs({ seed, domain, mood, vault });
      const result = circuit.evaluate(input);
      return { name, ticker: ticker(left, right, index), description: formatDescription(name, brief), seed, input, result };
    });
  }

  function paletteIndex(bits) {
    return bits.reduce((value, bit, index) => value | (bit << index), 0);
  }

  function svgFor(result) {
    const [bg, fg, accent] = palette[paletteIndex(result.paletteBits)];
    const cells = result.cells;
    const marks = [];
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const qRow = row < 4 ? row : 7 - row;
        const qColumn = column < 4 ? column : 7 - column;
        if (!cells[qRow * 4 + qColumn]) continue;
        const x = 73 + column * 32;
        const y = 73 + row * 32;
        const fill = (row + column) % 5 === 0 ? accent : fg;
        marks.push(`<rect x="${x}" y="${y}" width="27" height="27" rx="8" fill="${fill}"/>`);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="可复算的 LaunchDNA 标志"><rect width="400" height="400" rx="44" fill="${bg}"/><circle cx="200" cy="200" r="154" fill="none" stroke="${accent}" stroke-width="2" opacity=".38"/><circle cx="200" cy="200" r="139" fill="none" stroke="${fg}" stroke-width="1" opacity=".22"/>${marks.join("")}<circle cx="200" cy="200" r="5" fill="${accent}"/></svg>`;
  }

  function renderCandidates() {
    const list = $("candidate-list");
    list.replaceChildren();
    state.candidates.forEach((candidate, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `candidate${state.selected === index ? " selected" : ""}`;
      button.setAttribute("aria-pressed", String(state.selected === index));
      const mark = document.createElement("span");
      mark.className = "candidate-mini";
      mark.innerHTML = svgFor(candidate.result);
      const copy = document.createElement("span");
      copy.className = "candidate-text";
      const name = document.createElement("strong");
      name.textContent = candidate.name;
      const tickerLabel = document.createElement("span");
      tickerLabel.textContent = `$${candidate.ticker}`;
      copy.append(name, tickerLabel);
      button.append(mark, copy);
      button.addEventListener("click", () => { state.selected = index; renderCandidates(); renderSelected(); });
      list.append(button);
    });
  }

  function renderSelected() {
    const candidate = state.candidates[state.selected];
    if (!candidate) return;
    state.verifyRequest++;
    $("verify-chain").disabled = false;
    $("chain-verify-result").textContent = "点击后读取 X Layer 电路 #1 的实际输出，与本地结果逐位比较。";
    $("logo-preview").innerHTML = svgFor(candidate.result);
    $("chosen-name").value = candidate.name;
    $("chosen-ticker").value = candidate.ticker;
    $("chosen-description").value = candidate.description;
    $("input-bits").textContent = candidate.input.join("");
    $("output-bits").textContent = candidate.result.bits.join("");
    $("name-check-result").textContent = "仅提供辅助检查，不能保证名称或商标独占。";
    updateDownloadLinks();
  }

  function selectedCandidate() {
    const item = state.candidates[state.selected];
    if (!item) throw new Error("Please generate a brand first");
    return item;
  }

  function filenamePart(value) {
    return String(value).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "brand";
  }

  function syncEdits() {
    const item = selectedCandidate();
    item.name = $("chosen-name").value.trim().slice(0, 32);
    item.ticker = $("chosen-ticker").value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    item.description = $("chosen-description").value.trim().slice(0, 280);
    $("chosen-ticker").value = item.ticker;
    renderCandidates();
    updateDownloadLinks();
  }

  function makePack(item) {
    return {
      product: "LaunchDNA Brand Studio prototype",
      generatedAt: new Date().toISOString(),
      launchPlatform: "IGNIX on X Layer",
      launchPage: "https://ignix.bot/create?template=0",
      name: item.name, ticker: item.ticker, description: item.description,
      brief: state.brief, domain: domainLabels[state.domain], mood: moodLabels[state.mood],
      proposedVault: vaultLabels[state.vault],
      logo: { format: "SVG and separately downloadable PNG", svg: svgFor(item.result) },
      circuit: {
        status: "taped out on X Layer mainnet",
        name: circuit.name, chainId: 196,
        netlistSha256: state.artifact?.sha256 || null,
        processor: state.artifact?.onchain?.processor || null,
        transistorContract: state.artifact?.onchain?.transistors || null,
        circuitId: state.artifact?.onchain?.circuitId || 1,
        tapeoutTx: state.artifact?.onchain?.tapeoutTx || null,
        nandCount: circuit.gates.length,
        inputBits: item.input.join(""), outputBits: item.result.bits.join(""),
      },
      note: "Names come from an on-device scenario wordbank. The circuit computes logo bits; it does not interpret text. Verify name/ticker, rights, and IGNIX launch settings before publishing.",
    };
  }

  function updateDownloadLinks() {
    const item = selectedCandidate();
    const stem = filenamePart(item.name);
    const bits = item.result.bits.join("");
    const query = `bits=${bits}&name=${encodeURIComponent(stem)}`;
    $("download-svg").href = `/download/logo.svg?${query}`;
    $("download-png").href = `/download/logo.png?${query}`;
    $("pack-payload").value = JSON.stringify(makePack(item));
  }

  $("brand-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const brief = $("brief").value.trim();
    if (brief.length < 5) {
      $("form-error").textContent = "请至少写 5 个字，说明你的项目或应用场景。";
      $("form-error").hidden = false;
      $("brief").focus();
      return;
    }
    $("form-error").hidden = true;
    state.brief = brief;
    state.domain = $("domain").value === "auto" ? inferDomain(brief) : Number($("domain").value);
    state.mood = $("mood").value === "auto" ? inferMood(brief) : Number($("mood").value);
    state.vault = Number($("vault").value);
    state.candidates = generateCandidates(brief, state.domain, state.mood, state.vault);
    state.selected = 0;
    renderCandidates();
    renderSelected();
  });

  for (const id of ["chosen-name", "chosen-ticker", "chosen-description"]) {
    $(id).addEventListener("change", syncEdits);
  }

  $("verify-chain").addEventListener("click", async () => {
    const item = selectedCandidate();
    const inputBits = item.input.join("");
    const localBits = item.result.bits.join("");
    const button = $("verify-chain");
    const result = $("chain-verify-result");
    if (!state.artifact?.onchain?.processor) {
      result.textContent = "电路资料尚未加载，请稍后重试。";
      return;
    }
    const requestId = ++state.verifyRequest;
    button.disabled = true;
    result.textContent = "正在读取 X Layer 电路 #1 的计算结果…";
    try {
      const response = await fetch(`/api/circuit/eval?input=${inputBits}`, { cache: "no-store" });
      if (!response.ok) throw new Error("RPC unavailable");
      const data = await response.json();
      if (
        data.chainId !== 196 ||
        data.circuitId !== state.artifact.onchain.circuitId ||
        data.processor.toLowerCase() !== state.artifact.onchain.processor.toLowerCase() ||
        data.inputBits !== inputBits ||
        !/^[01]{20}$/.test(data.outputBits)
      ) throw new Error("Invalid chain response");
      if (requestId !== state.verifyRequest) return;
      result.textContent = data.outputBits === localBits
        ? "核验通过：链上电路 NFT #1 的 20 位输出与当前 Logo 完全一致。"
        : "核验不一致：链上输出与本地 Logo 不同，请不要使用当前素材。";
    } catch {
      if (requestId === state.verifyRequest) result.textContent = "链上核验暂不可用，请稍后重试；本地电路仍可离线运行。";
    } finally {
      if (requestId === state.verifyRequest) button.disabled = false;
    }
  });

  $("check-names").addEventListener("click", async () => {
    syncEdits();
    const item = selectedCandidate();
    const result = $("name-check-result");
    const button = $("check-names");
    button.disabled = true;
    result.textContent = "正在查询 IGNIX 公开代币列表…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      let checked = 0, complete = false;
      const matches = [];
      for (let page = 1; page <= 5; page++) {
        const response = await fetch(`https://api.ignix.bot/v1/launches?limit=50&page=${page}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const launches = data?.data?.launches;
        if (!Array.isArray(launches)) throw new Error("Invalid API response");
        checked += launches.length;
        for (const launch of launches) {
          if (String(launch.name || "").toLowerCase() === item.name.toLowerCase() || String(launch.symbol || "").toLowerCase() === item.ticker.toLowerCase()) matches.push(launch);
        }
        if (launches.length < 50) { complete = true; break; }
      }
      result.textContent = matches.length
        ? `已检查 ${checked} 个公开项目，发现 ${matches.length} 个名称或 Ticker 完全相同。请自行核对具体项目与商标。`
        : `已检查 ${checked} 个公开项目，未见完全同名${complete ? "" : "（仅限前 5 页）"}；这不保证名称或商标独占。`;
    } catch {
      result.textContent = "公开列表暂时无法读取。请到 IGNIX 手动搜索名称和 Ticker；商标仍需自行核对。";
    } finally { clearTimeout(timeout); button.disabled = false; }
  });

  fetch("./circuit.json").then((response) => response.ok ? response.json() : Promise.reject()).then((artifact) => {
    if (artifact.nandCount !== circuit.gates.length || artifact.nIn !== circuit.nIn || artifact.nOut !== circuit.nOut) throw new Error("Circuit artifact mismatch");
    state.artifact = artifact;
    $("netlist-hash").textContent = artifact.sha256;
    $("gate-count").textContent = `${artifact.nandCount} NAND · ${artifact.nIn} 输入 / ${artifact.nOut} 输出`;
    updateDownloadLinks();
  }).catch(() => { $("netlist-hash").textContent = "网表文件暂不可读取"; });

  $("brand-form").requestSubmit();
})();
