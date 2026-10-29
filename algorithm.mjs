/*==============================================================
  THUẬT TOÁN DỰ ĐOÁN TÀI XỈU LC79 - FULL VERSION
  Tích hợp: Bảng tra tổng + Phân tích cầu + Markov + Pattern
            + Cycle + Frequency + Tổng điểm + Khung giờ
==============================================================*/

const MAX_HISTORY = 50;

/*==============================================================
  PHẦN 1: HÀM TÍNH TÀI/XỈU CƠ BẢN
==============================================================*/
export function getTaiXiu(d1, d2, d3) {
  const total = d1 + d2 + d3;
  return total <= 10 ? "Xỉu" : "Tài";
}

/*==============================================================
  PHẦN 2: BẢNG TRA TỔNG ĐIỂM
==============================================================*/
const BANG_TRA = {
  // Xỉu
  3: { result: "Xỉu", percent: 80, note: "111 - trừ khi sún soi" },
  4: { result: "Xỉu", percent: 70, note: "" },
  5: { result: "Xỉu", percent: 70, note: "113,122,131..." },
  6: {
    special: {
      "123": "Tài", "114": "Tài", "132": "Tài", "213": "Tài",
      "222": "Xỉu", "411": "Xỉu"
    }
  },
  7: {
    special: {
      "124": { result: "Tài", percent: 89 },
      "133": { result: "Tài", percent: 89 },
      "331": { result: "Tài", percent: 89 },
      "223": "Xỉu", "232": "Xỉu", "115": "Xỉu",
      "151": "Xỉu", "511": "Xỉu", "241": "Xỉu"
    }
  },
  8: {
    special: {
      "134": "Tài", "224": "Tài", "323": "Tài",
      "116": "Xỉu", "125": "Xỉu", "233": "Xỉu", "143": "Xỉu",
      "251": "Xỉu", "512": "Xỉu", "611": "Xỉu", "431": "Xỉu"
    }
  },
  9: {
    special: {
      "126": "Tài", "135": "Tài", "144": "Tài", "333": "Tài",
      "225": "Xỉu", "234": "Xỉu", "261": "Xỉu",
      "252": "Xỉu", "315": "Xỉu", "153": "Xỉu"
    }
  },
  10: {
    special: {
      "136": "Tài", "145": "Tài", "244": "Tài", "343": "Tài",
      "226": "Xỉu", "235": "Xỉu", "334": "Xỉu", "163": "Xỉu",
      "316": "Xỉu", "424": "Xỉu", "613": "Xỉu", "451": "Xỉu"
    }
  },
  // Tài
  11: {
    special: {
      "236": "Tài", "344": "Tài", "434": "Tài",
      "632": "Xỉu", "263": "Xỉu", "326": "Xỉu", "155": "Xỉu",
      "461": "Xỉu", "146": "Xỉu", "614": "Xỉu", "452": "Xỉu",
      "254": "Xỉu", "353": "Xỉu", "533": "Xỉu"
    }
  },
  12: {
    special: {
      "156": "Tài", "255": "Tài", "336": "Tài", "345": "Tài",
      "246": "Auto Xỉu", "444": "Auto Xỉu",
      "651": "Tài", "561": "Tài", "165": "Tài", "516": "Tài",
      "615": "Tài", "552": "Tài", "354": "Tài", "543": "Tài",
      "633": "Tài", "363": "Tài", "426": "Tài", "624": "Tài"
    }
  },
  13: {
    special: {
      "346": "Tài", "355": "Tài", "445": "Tài",
      "166": "Xỉu", "256": "Xỉu"
    }
  },
  14: {
    special: {
      "356": "Tài", "455": "Tài",
      "266": "Xỉu", "446": "Xỉu", "554": "Xỉu"
    }
  },
  15: {
    special: {
      "456": "Tài", "555": "Tài",
      "366": "Xỉu", "465": "Xỉu"
    }
  },
  16: {
    special: {
      "556": "Xỉu", "466": "Xỉu",
      "664": "Tài", "646": "Tài"
    }
  },
  17: { special: { "566": "Tài" } },
  18: { special: { "666": "BỎ" } }
};

/*==============================================================
  PHẦN 3: HÀM TRA BẢNG TỔNG ĐIỂM
==============================================================*/
export function traBangTong(d1, d2, d3) {
  const total = d1 + d2 + d3;
  const diceStr = [d1, d2, d3].sort((a, b) => a - b).join("");

  if (total === 18) return { result: "BỎ", percent: 0, note: "666" };

  const entry = BANG_TRA[total];
  if (!entry) return null;

  if (entry.special) {
    const diceStr2 = [d1, d2, d3].join("");
    const match = entry.special[diceStr] || entry.special[diceStr2];
    if (match) {
      if (typeof match === "string") {
        if (match === "Auto Xỉu") return { result: "Xỉu", percent: 90, note: "Auto" };
        if (match === "BỎ") return { result: "BỎ", percent: 0, note: "666" };
        return { result: match, percent: 75, note: "" };
      }
      return match;
    }
    return null;
  }

  return { result: entry.result, percent: entry.percent, note: entry.note };
}

/*==============================================================
  PHẦN 4: NHẬN DIỆN CẦU ĐẶC BIỆT (theo file gốc)
==============================================================*/
export function nhanDienCau(history) {
  if (!history || history.length < 3) return null;

  const seq = history.map(h => h.ket_qua);
  const tongSeq = history.map(h => h.tong);

  // 1. Cầu 3 trắng đen + cặp 9-10-7
  if (seq.length >= 3) {
    const last3 = seq.slice(0, 3);
    const last3Tong = tongSeq.slice(0, 3);
    const isTXT = (last3[0] === "Tài" && last3[1] === "Xỉu" && last3[2] === "Tài");
    const isXTX = (last3[0] === "Xỉu" && last3[1] === "Tài" && last3[2] === "Xỉu");
    const has9710 = last3Tong.some(t => t === 9 || t === 10 || t === 7);

    if ((isTXT || isXTX) && has9710) {
      return {
        result: seq[0] === "Tài" ? "Xỉu" : "Tài",
        percent: 80,
        note: "Cầu 3 trắng đen + 9-10-7"
      };
    }
  }

  // 2. Cầu lặp 10-11 hoặc 8-9
  if (seq.length >= 4) {
    const t = tongSeq;
    if ((t[0] === 10 && t[1] === 11 && t[2] === 10 && t[3] === 11) ||
        (t[0] === 8 && t[1] === 9 && t[2] === 8 && t[3] === 9)) {
      return {
        result: seq[0] === "Tài" ? "Xỉu" : "Tài",
        percent: 80,
        note: "Cầu lặp 10-11 hoặc 8-9"
      };
    }
  }

  // 3. Cầu chạy 1-1 so le (12-8-12, 7-12-7)
  if (seq.length >= 3) {
    if (tongSeq[0] === 12 && tongSeq[1] === 8 && tongSeq[2] === 12) {
      return { result: "Xỉu", percent: 99, note: "Cầu 12-8-12 auto bẻ X10" };
    }
    if (tongSeq[0] === 7 && tongSeq[1] === 12 && tongSeq[2] === 7) {
      return { result: "Xỉu", percent: 85, note: "Cầu 7-12-7" };
    }
  }

  // 4. Cầu 8 xen kẽ
  if (seq.length >= 7) {
    if (tongSeq[0] === 8 && tongSeq[2] === 8 && tongSeq[4] === 8 && tongSeq[6] === 8) {
      return { result: "Xỉu", percent: 90, note: "Cầu 8 xen kẽ auto bẻ Xỉu" };
    }
  }

  // 5. Cầu bệt 11-14 + con mới
  if (seq.length >= 5) {
    const last5 = seq.slice(0, 5);
    const last5Tong = tongSeq.slice(0, 5);
    const isBiet = last5[1] === last5[2] && last5[2] === last5[3];
    if (isBiet && last5[0] !== last5[1]) {
      const biecTong = last5Tong.slice(1, 4);
      const isBiet1112 = biecTong.every(t => t >= 11 && t <= 14);
      if (isBiet1112) {
        return {
          result: last5[0] === "Tài" ? "Xỉu" : "Tài",
          percent: 61,
          note: "Cầu bệt 11-14 + con mới"
        };
      }
    }
  }

  // 6. 3 trắng/3 đen
  if (seq.length >= 3) {
    const last3 = seq.slice(0, 3);
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      return {
        result: last3[0] === "Tài" ? "Xỉu" : "Tài",
        percent: 65,
        note: "3 trắng/3 đen bẻ nhẹ"
      };
    }
  }

  // 7. Đa số 5-4-3
  if (seq.length >= 3) {
    const sorted = [...tongSeq.slice(0, 3)].sort((a, b) => b - a);
    if (sorted[0] === 5 && sorted[1] === 4 && sorted[2] === 3) {
      return { result: "BỎ", percent: 86, note: "Cầu 5-4-3 đứt" };
    }
  }

  return null;
}

/*==============================================================
  PHẦN 5: PHÂN TÍCH CẦU BỆT + 1-1 (gộp từ Python)
==============================================================*/
export function phanTichCauBiet11(history) {
  if (!history || history.length < 4) {
    return { detected: false, message: "Cần ít nhất 4 kết quả" };
  }

  const seq = history.map(h => h.ket_qua);
  const n = seq.length;

  // ---------- 5.1 CẦU BỆT ----------
  let streakLen = 1;
  for (let i = n - 2; i >= 0; i--) {
    if (seq[i] === seq[0]) streakLen++;
    else break;
  }
  const isBet = streakLen >= 3;
  const betInfo = {
    detected: isBet,
    length: streakLen,
    side: isBet ? seq[0] : null,
    // Bệt 3-4: đánh tiếp | Bệt >=5: cân nhắc bẻ
    prediction: isBet
      ? (streakLen >= 5 ? (seq[0] === "Tài" ? "Xỉu" : "Tài") : seq[0])
      : null,
    confidence: Math.min(streakLen / 5, 1) * 100
  };

  // ---------- 5.2 CẦU 1-1 ----------
  let altLen = 1;
  for (let i = n - 2; i >= 0; i--) {
    if (seq[i] !== seq[i + 1]) altLen++;
    else break;
  }
  const is11 = altLen >= 4;
  const altInfo = {
    detected: is11,
    length: altLen,
    prediction: is11 ? (seq[0] === "Tài" ? "Xỉu" : "Tài") : null,
    confidence: Math.min(altLen / 6, 1) * 100
  };

  // ---------- 5.3 TỔNG HỢP ----------
  if (isBet && !is11) {
    return {
      detected: true,
      result: betInfo.prediction,
      percent: betInfo.confidence,
      note: `Cầu bệt ${betInfo.length} (${betInfo.side})`
    };
  }
  if (is11 && !isBet) {
    return {
      detected: true,
      result: altInfo.prediction,
      percent: altInfo.confidence,
      note: `Cầu 1-1 ${altInfo.length}`
    };
  }
  if (isBet && is11) {
    const pick = betInfo.length >= altInfo.length ? betInfo : altInfo;
    return {
      detected: true,
      result: pick.prediction,
      percent: pick.confidence,
      note: `Ưu tiên cầu dài hơn (${pick.length})`
    };
  }

  return { detected: false, message: "Chưa đủ tín hiệu cầu" };
}

/*==============================================================
  PHẦN 6: MARKOV CHAIN
==============================================================*/
function analyzeMarkov(seq, order) {
  const transitions = {};
  const counts = { Tài: 0, Xỉu: 0 };

  for (let i = 0; i < seq.length - order; i++) {
    const key = seq.slice(i, i + order).join("-");
    const next = seq[i + order];
    if (!transitions[key]) transitions[key] = { Tài: 0, Xỉu: 0 };
    transitions[key][next]++;
  }

  const lastState = seq.slice(0, order).join("-");
  if (transitions[lastState]) {
    const { Tài, Xỉu } = transitions[lastState];
    const total = Tài + Xỉu;
    if (total > 0) {
      counts.Tài = Tài / total;
      counts.Xỉu = Xỉu / total;
    }
  }
  return counts;
}

/*==============================================================
  PHẦN 7: PATTERN RECOGNITION
==============================================================*/
function analyzePatterns(seq) {
  const scores = { Tài: 0.5, Xỉu: 0.5 };
  const patternLength = 3;
  if (seq.length < patternLength + 2) return scores;

  const currentPattern = seq.slice(0, patternLength).join("");
  let taiMatches = 0, xiuMatches = 0, totalMatches = 0;

  for (let i = patternLength; i < seq.length - 1; i++) {
    const testPattern = seq.slice(i - patternLength, i).join("");
    if (testPattern === currentPattern) {
      const next = seq[i];
      if (next === "Tài") taiMatches++;
      else if (next === "Xỉu") xiuMatches++;
      totalMatches++;
    }
  }
  if (totalMatches > 0) {
    scores.Tài = taiMatches / totalMatches;
    scores.Xỉu = xiuMatches / totalMatches;
  }
  return scores;
}

/*==============================================================
  PHẦN 8: PHÂN TÍCH TỔNG ĐIỂM
==============================================================*/
function analyzeTong(tongSeq) {
  if (tongSeq.length < 3) return { Tài: 0.5, Xỉu: 0.5 };
  const scores = { Tài: 0, Xỉu: 0 };
  const recentAvg = tongSeq.reduce((a, b) => a + b, 0) / tongSeq.length;
  let increasing = 0, decreasing = 0;

  for (let i = 1; i < tongSeq.length; i++) {
    if (tongSeq[i] > tongSeq[i - 1]) increasing++;
    else if (tongSeq[i] < tongSeq[i - 1]) decreasing++;
  }

  if (increasing > decreasing) { scores.Tài = 0.7; scores.Xỉu = 0.3; }
  else if (decreasing > increasing) { scores.Tài = 0.3; scores.Xỉu = 0.7; }
  else {
    scores.Tài = recentAvg > 10.5 ? 0.6 : 0.4;
    scores.Xỉu = 1 - scores.Tài;
  }
  return scores;
}

/*==============================================================
  PHẦN 9: PHÂN TÍCH CHU KỲ
==============================================================*/
function analyzeCycles(seq) {
  if (seq.length < 6) return { Tài: 0.5, Xỉu: 0.5 };
  const scores = { Tài: 0, Xỉu: 0 };
  const maxCycleLength = Math.min(10, Math.floor(seq.length / 2));
  let bestCycle = 0, bestCorrelation = 0;

  for (let cycle = 2; cycle <= maxCycleLength; cycle++) {
    let matches = 0, total = 0;
    for (let i = 0; i < seq.length - cycle; i++) {
      if (seq[i] === seq[i + cycle]) matches++;
      total++;
    }
    const correlation = matches / total;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestCycle = cycle;
    }
  }

  if (bestCycle > 0 && bestCorrelation > 0.6) {
    const predicted = seq[seq.length - bestCycle];
    if (predicted === "Tài") { scores.Tài = 0.8; scores.Xỉu = 0.2; }
    else { scores.Tài = 0.2; scores.Xỉu = 0.8; }
  }
  return scores;
}

/*==============================================================
  PHẦN 10: KIỂM TRA KHUNG GIỜ
==============================================================*/
function checkKhungGio() {
  const now = new Date();
  const hour = now.getHours();
  // 0h - 5h sáng: KHÔNG ÁP DỤNG CÔNG THỨC
  if (hour >= 0 && hour < 5) return true;
  return false;
}

/*==============================================================
  PHẦN 11: THUẬT TOÁN DỰ ĐOÁN NÂNG CAO TỔNG HỢP
==============================================================*/
export function duDoanNangCao(history, last_n = 15) {
  if (!history || history.length < 3) {
    return { result: "Chưa có dữ liệu", confidence: 0, reason: "Thiếu dữ liệu" };
  }

  // ========== 11.0 KHUNG GIỜ ==========
  if (checkKhungGio()) {
    return { result: "BỎ", confidence: 0, reason: "Khung giờ không áp dụng (0h-5h)" };
  }

  // ========== 11.1 NHẬN DIỆN CẦU ĐẶC BIỆT (ưu tiên 1) ==========
  const cauDacBiet = nhanDienCau(history);
  if (cauDacBiet) {
    if (cauDacBiet.result === "BỎ") {
      return { result: "BỎ", confidence: 0, reason: cauDacBiet.note };
    }
    return {
      result: cauDacBiet.result,
      confidence: Math.min(cauDacBiet.percent, 95),
      reason: cauDacBiet.note
    };
  }

  // ========== 11.2 CẦU BỆT / 1-1 (ưu tiên 2) ==========
  const cauBiet11 = phanTichCauBiet11(history);
  if (cauBiet11.detected) {
    if (cauBiet11.result === "BỎ") {
      return { result: "BỎ", confidence: 0, reason: cauBiet11.note };
    }
    return {
      result: cauBiet11.result,
      confidence: Math.min(Math.round(cauBiet11.percent), 95),
      reason: cauBiet11.note
    };
  }

  // ========== 11.3 TÍN HIỆU PHỤ: BẢNG TRA TỔNG ĐIỂM ==========
  const bangTraBoost = { Tài: 0, Xỉu: 0 };
  const lastItem = history[0];
  if (lastItem && lastItem.xuc_xac_1 != null) {
    const bt = traBangTong(lastItem.xuc_xac_1, lastItem.xuc_xac_2, lastItem.xuc_xac_3);
    if (bt && bt.result !== "BỎ" && bt.percent >= 80) {
      bangTraBoost[bt.result] = 0.05;
    }
  }

  // ========== 11.4 5 MODULE SONG SONG ==========
  const seq = history.map(h => h.ket_qua);
  const tongSeq = history.map(h => h.tong);
  const recent = seq.slice(0, Math.min(last_n, seq.length));
  const recentTong = tongSeq.slice(0, Math.min(last_n, tongSeq.length));

  // Frequency
  const taiCount = recent.filter(s => s === "Tài").length;
  const xiuCount = recent.length - taiCount;
  const freq = {
    Tài: recent.length ? taiCount / recent.length : 0.5,
    Xỉu: recent.length ? xiuCount / recent.length : 0.5
  };

  // Markov bậc 2 & 3
  const m2 = analyzeMarkov(seq, 2);
  const m3 = analyzeMarkov(seq, 3);
  const markov = {
    Tài: m2.Tài * 0.4 + m3.Tài * 0.6,
    Xỉu: m2.Xỉu * 0.4 + m3.Xỉu * 0.6
  };

  // Pattern
  const pattern = analyzePatterns(seq);

  // Tổng điểm
  const tong = analyzeTong(recentTong);

  // Cycle
  const cycle = analyzeCycles(seq);

  // ========== 11.5 TỔNG HỢP TRỌNG SỐ ==========
  const W = {
    frequency: 0.15,
    markov: 0.25,
    pattern: 0.25,
    tong: 0.15,
    cycle: 0.20
  };

  const final = {
    Tài:
      freq.Tài * W.frequency +
      markov.Tài * W.markov +
      pattern.Tài * W.pattern +
      tong.Tài * W.tong +
      cycle.Tài * W.cycle +
      bangTraBoost.Tài,
    Xỉu:
      freq.Xỉu * W.frequency +
      markov.Xỉu * W.markov +
      pattern.Xỉu * W.pattern +
      tong.Xỉu * W.tong +
      cycle.Xỉu * W.cycle +
      bangTraBoost.Xỉu
  };

  // ========== 11.6 QUYẾT ĐỊNH ==========
  const threshold = 0.08;
  const diff = Math.abs(final.Tài - final.Xỉu);

  if (diff < threshold) {
    const last3 = recent.slice(0, 3);
    const last3Tai = last3.filter(s => s === "Tài").length;
    const last3Xiu = last3.filter(s => s === "Xỉu").length;
    if (last3Tai > last3Xiu) {
      return { result: "Tài", confidence: 55, reason: "Trend 3 phiên" };
    }
    if (last3Xiu > last3Tai) {
      return { result: "Xỉu", confidence: 55, reason: "Trend 3 phiên" };
    }
    return {
      result: taiCount >= xiuCount ? "Tài" : "Xỉu",
      confidence: 52,
      reason: "Tần suất tổng"
    };
  }

  const result = final.Tài > final.Xỉu ? "Tài" : "Xỉu";
  const confidence = Math.round(Math.max(final.Tài, final.Xỉu) * 100);

  return {
    result,
    confidence: Math.min(confidence, 95),
    reason: "Tổng hợp đa thuật toán"
  };
}

/*==============================================================
  PHẦN 12: TÍNH ĐỘ TIN CẬY (BACKTEST)
==============================================================*/
export function calculateConfidence(history, prediction, last_n = 12) {
  if (!history || history.length < 4) return 0;
  let correct = 0, total = 0;
  const recent = history.slice(0, Math.min(last_n, history.length - 1));

  for (let i = 0; i < recent.length - 1; i++) {
    if (i + 3 >= history.length) break;
    const historySlice = history.slice(i);
    const predict = duDoanNangCao(historySlice, last_n);
    if (predict && predict.result === history[i + 1]?.ket_qua) correct++;
    total++;
  }

  const baseConfidence = total > 0 ? (correct / total) * 100 : 0;
  const dataBonus = Math.min((history.length / 50) * 10, 10);
  return Math.round(Math.min(baseConfidence + dataBonus, 100));
}

/*==============================================================
  PHẦN 13: HÀM DỰ ĐOÁN CHÍNH (TƯƠNG THÍCH)
==============================================================*/
export function duDoan(history, last_n = 12) {
  const result = duDoanNangCao(history, last_n);
  return result.result;
}

/*==============================================================
  PHẦN 14: CẬP NHẬT LỊCH SỬ
==============================================================*/
export function updateResult(store, history, result) {
  Object.assign(store, result);
  history.unshift({ ...result });
  if (history.length > MAX_HISTORY) history.pop();
}

/*==============================================================
  PHẦN 15: EXPORT
==============================================================*/
export { MAX_HISTORY, BANG_TRA };