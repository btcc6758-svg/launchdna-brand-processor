(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.LaunchDNARender = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
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
  function paletteIndex(bits) {
    return bits.reduce((value, bit, index) => value | (bit << index), 0);
  }
  function svgFor(bits) {
    if (!Array.isArray(bits) || bits.length !== 20 || bits.some((bit) => bit !== 0 && bit !== 1)) throw new Error("20 binary outputs required");
    const [bg, fg, accent] = palette[paletteIndex(bits.slice(16))];
    const marks = [];
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const qRow = row < 4 ? row : 7 - row;
        const qColumn = column < 4 ? column : 7 - column;
        if (!bits[qRow * 4 + qColumn]) continue;
        const x = 73 + column * 32;
        const y = 73 + row * 32;
        const fill = (row + column) % 5 === 0 ? accent : fg;
        marks.push(`<rect x="${x}" y="${y}" width="27" height="27" rx="8" fill="${fill}"/>`);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="可复算的 LaunchDNA 标志"><rect width="400" height="400" rx="44" fill="${bg}"/><circle cx="200" cy="200" r="154" fill="none" stroke="${accent}" stroke-width="2" opacity=".38"/><circle cx="200" cy="200" r="139" fill="none" stroke="${fg}" stroke-width="1" opacity=".22"/>${marks.join("")}<circle cx="200" cy="200" r="5" fill="${accent}"/></svg>`;
  }
  return Object.freeze({ palette, paletteIndex, svgFor });
});
