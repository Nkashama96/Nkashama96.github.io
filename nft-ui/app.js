// Minimal NFT UI - Barcode Reader (UI only, dedup-ready)

// Load ZXing (1D + 2D)
const script = document.createElement("script");
script.src = "https://unpkg.com/@zxing/library@latest";
document.head.appendChild(script);

const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("preview");
const output = document.getElementById("metadataOutput");
const clearBtn = document.getElementById("clearBtn");
const mintPreviewBtn = document.getElementById("mintPreviewBtn");

let collectedData = [];

// ---------- UI EVENTS ----------

chooseBtn.onclick = () => fileInput.click();

dropzone.ondragover = e => {
  e.preventDefault();
  dropzone.style.background = "#f2f2f2";
};

dropzone.ondragleave = () => {
  dropzone.style.background = "";
};

dropzone.ondrop = e => {
  e.preventDefault();
  dropzone.style.background = "";
  handleFiles(e.dataTransfer.files);
};

fileInput.onchange = e => handleFiles(e.target.files);

// ---------- CORE LOGIC ----------

async function handleFiles(files) {
  preview.innerHTML = "";
  collectedData = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const imgURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = imgURL;
    await img.decode();

    const result = await decodeBarcode(img);
    preview.appendChild(createThumb(imgURL, result));

    if (!result) continue;

    // Trim barcode text
    const barcodeText = result.text.trim();

    // Validate duplicate (barcode_data)
    if (isDuplicateBarcode(barcodeText)) continue;

    collectedData.push({
      sequence: collectedData.length + 1,
      barcode_data: barcodeText,
      barcode_type: result.format
    });
  }
}

// ---------- BARCODE DECODER ----------

async function decodeBarcode(img) {
  if (!window.ZXing) return null;

  const reader = new ZXing.BrowserMultiFormatReader();
  try {
    const result = await reader.decodeFromImageElement(img);
    return {
      text: result.text,
      format: result.barcodeFormat
    };
  } catch {
    return null;
  }
}

// ---------- VALIDATION ----------

function isDuplicateBarcode(barcodeText) {
  return collectedData.some(
    item => item.barcode_data === barcodeText
  );
}

// ---------- UI HELPERS ----------

function createThumb(src, barcode) {
  const div = document.createElement("div");
  div.className = "thumb";

  const img = document.createElement("img");
  img.src = src;

  const info = document.createElement("div");
  info.className = "info";

  info.innerHTML = barcode
    ? `<span>${barcode.format}</span><span>✔</span>`
    : `<span>No barcode</span><span>✖</span>`;

  div.append(img, info);
  return div;
}

// ---------- METADATA PREVIEW ----------

mintPreviewBtn.onclick = () => {
  output.hidden = false;
  output.textContent = JSON.stringify(
    {
      asset_name: document.getElementById("assetName").value,
      description: document.getElementById("assetDesc").value,
      barcodes: collectedData
    },
    null,
    2
  );
};

// ---------- RESET ----------

clearBtn.onclick = () => {
  preview.innerHTML = "";
  output.hidden = true;
  collectedData = [];
};
