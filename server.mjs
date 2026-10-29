import express from "express";
import { fetch as wreqFetch } from 'wreq-js'; // Thay thế fetch mặc định
import { duDoanNangCao } from "./algorithm.mjs";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

const PORT = process.env.PORT || 3000;
const UPSTREAM_URL = process.env.UPSTREAM_URL || "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=3959701241b686f12e01bfe9c3a319b8";

function normalizeResult(value) {
  const s = String(value ?? "").trim().toUpperCase();
  if (s === "TAI" || s === "TÀI") return "Tài";
  if (s === "XIU" || s === "XỈU") return "Xỉu";
  if (s === "BO" || s === "BỎ") return "BỎ";
  return "";
}

async function getUpstream() {
  try {
    // Sử dụng wreqFetch để giả lập TLS fingerprint của Chrome
    const response = await wreqFetch(UPSTREAM_URL, {
      method: "GET",
      browser: 'chrome_120', 
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://tele68.com/",
        "Origin": "https://tele68.com",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      signal: AbortSignal.timeout(15000)
    });

    const body = await response.text();
    
    if (!response.ok) {
      const sample = body.replace(/\s+/g, " ").slice(0, 300);
      throw new Error(`API nguồn trả HTTP ${response.status}${sample ? `: ${sample}` : ""}`);
    }
    
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(`API nguồn không trả JSON hợp lệ: ${body.replace(/\s+/g, " ").slice(0, 200)}`);
    }
  } catch (error) {
    // Bắt lỗi mạng hoặc lỗi timeout từ wreqFetch
    throw new Error(`Lỗi kết nối đến API nguồn: ${error.message}`);
  }
}

function parseRows(payload) {
  const rows = Array.isArray(payload) ? payload : (payload?.list ?? payload?.data ?? payload?.sessions ?? []);
  if (!Array.isArray(rows)) throw new Error("Cấu trúc JSON nguồn không có mảng list/data/sessions");
  return rows.map((r) => {
    const dice = Array.isArray(r.dices) ? r.dices : [
      r.xuc_xac_1, r.xuc_xac_2, r.xuc_xac_3
    ];
    const d1 = Number(dice?.[0]), d2 = Number(dice?.[1]), d3 = Number(dice?.[2]);
    const id = Number(r.id ?? r.phien ?? r.session_id);
    const result = normalizeResult(r.resultTruyenThong ?? r.ket_qua ?? r.result);
    const total = Number(r.point ?? r.tong ?? (d1 + d2 + d3));
    return {
      id, _id: r._id ?? null,
      xuc_xac_1: Number.isFinite(d1) ? d1 : null,
      xuc_xac_2: Number.isFinite(d2) ? d2 : null,
      xuc_xac_3: Number.isFinite(d3) ? d3 : null,
      tong: Number.isFinite(total) ? total : null,
      ket_qua: result,
      raw: r
    };
  }).filter(r => Number.isFinite(r.id))
    .sort((a,b) => b.id - a.id);
}

function validHistory(rows) {
  return rows.filter(r => ["Tài", "Xỉu"].includes(r.ket_qua)
    && [r.xuc_xac_1,r.xuc_xac_2,r.xuc_xac_3].every(n => Number.isFinite(n)));
}

app.get("/", (_req, res) => res.json({
  status: "ok",
  name: "NHAN VIP MD5 API",
  owner: "@nhan161019",
  endpoint: "/api",
  note: "Dự đoán chỉ mang tính tham khảo, không đảm bảo kết quả."
}));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api", async (_req, res) => {
  try {
    const payload = await getUpstream();
    const rows = parseRows(payload);
    const history = validHistory(rows);
    if (history.length < 3) {
      return res.status(502).json({ error: "API nguồn chưa trả đủ ít nhất 3 phiên có xúc xắc hợp lệ." });
    }

    const latest = history[0];
    const prediction = duDoanNangCao(history.map(r => ({
      ket_qua: r.ket_qua,
      tong: r.tong,
      xuc_xac_1: r.xuc_xac_1,
      xuc_xac_2: r.xuc_xac_2,
      xuc_xac_3: r.xuc_xac_3
    })), 15);

    const phienTruoc = latest.id;
    const phienNay = latest.id + 1;
    const confidence = Math.max(0, Math.min(95, Number(prediction.confidence) || 0));
    const recent = history.slice(0, 20).map((r, i) => {
      const pred = i + 1 < history.length
        ? duDoanNangCao(history.slice(i + 1).map(x => ({
            ket_qua: x.ket_qua, tong: x.tong,
            xuc_xac_1: x.xuc_xac_1, xuc_xac_2: x.xuc_xac_2, xuc_xac_3: x.xuc_xac_3
          })), 15).result
        : null;
      return {
        phien: r.id,
        du_doan: pred ?? "Chưa có",
        ket_qua: r.ket_qua,
        trang_thai: pred ? (pred === r.ket_qua ? "thắng" : "thua") : "đã có kết quả"
      };
    });

    const counts = history.slice(0, 50).reduce((acc, r) => {
      if (r.ket_qua === "Tài") acc.thang++;
      if (r.ket_qua === "Xỉu") acc.thua++;
      return acc;
    }, { thang: 0, thua: 0 });

    const out = {
      id: "@nhan161019",
      game: "LC79 MD5",
      phien_truoc: phienTruoc,
      xuc_xac1: latest.xuc_xac_1,
      xuc_xac2: latest.xuc_xac_2,
      xuc_xac3: latest.xuc_xac_3,
      ket_qua: latest.ket_qua,
      thoi_gian: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }),
      phien_nay: phienNay,
      du_doan: prediction.result,
      do_tin_cay: `${confidence.toFixed(1)}%`,
      thong_ke: {
        thang: counts.thang,
        thua: counts.thua,
        tong: counts.thang + counts.thua,
        ti_le_thang: counts.thang + counts.thua
          ? `${(counts.thang / (counts.thang + counts.thua) * 100).toFixed(1)}%` : "0.0%",
        chuoi_thang_hien_tai: 0,
        chuoi_thua_hien_tai: 0,
        chuoi_thang_dai_nhat: 0,
        chuoi_thua_dai_nhat: 0
      },
      lich_su: recent,
      ghi_chu: prediction.reason,
      nguon_phien: "wtxmd52.tele68.com",
      canh_bao: "Độ tin cậy là điểm do thuật toán tự tính, không phải xác suất thắng đã được kiểm chứng."
    };
    res.set("Cache-Control", "no-store");
    res.json(out);
  } catch (err) {
    res.status(502).json({
      error: "Không lấy hoặc xử lý được dữ liệu API nguồn",
      detail: err?.message ?? String(err),
      owner: "@nhan161019"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`NHAN VIP MD5 API listening on ${PORT}`));
