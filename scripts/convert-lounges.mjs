import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const source = path.join(root, "W020260702557021741944.xlsx");
const output = path.join(root, "data", "lounges.json");
const sheetName = "贵宾厅境外机场清单";

const fieldMap = {
  "州": "continent",
  "国家": "country",
  "城市": "city",
  "站点": "airport",
  "三字码": "code",
  "航站楼": "terminal",
  "名称": "loungeName",
  "出发类型": "departureType",
  "安检类型": "securityType",
  "位置指引": "directions"
};

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).replace(/\u3000/g, " ").trim();
}

const workbook = xlsx.readFile(source);
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  throw new Error(`Missing sheet: ${sheetName}`);
}

const rows = xlsx.utils.sheet_to_json(sheet, { defval: "", raw: false });
const missing = Object.keys(fieldMap).filter((column) => !Object.prototype.hasOwnProperty.call(rows[0] ?? {}, column));

if (missing.length) {
  throw new Error(`Missing required columns: ${missing.join(", ")}`);
}

const records = rows.map((row, index) => {
  const item = { id: `lounge-${String(index + 1).padStart(4, "0")}` };
  for (const [sourceKey, targetKey] of Object.entries(fieldMap)) {
    item[targetKey] = clean(row[sourceKey]);
  }
  return item;
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Wrote ${records.length} lounges to ${path.relative(root, output)}`);
