import {
  BrowserMultiFormatReader
} from "https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/+esm";

const reader = new BrowserMultiFormatReader();

const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const preview = document.getElementById("preview");
const output = document.getElementById("metadataOutput");
const mintBtn = document.getElementById("mintPreviewBtn");
const clearBtn = document.getElementById("clearBtn");

let barcodeList = [];

chooseBtn.onclick = () => fileInput.click();
clearBtn.onclick = reset;

fileInput.onchange = async () => {
  barcodeList = [];
  preview.innerHTML = "";
  output.hidden = true;

  for (const file of fileInput.files) {
    await processImage(file);
  }
};

async function processImage(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  const trimmedCanvas = trimWhitespace(img);
  const previewImg = document.createElement("img");
  previewImg.src = trimmedCanvas.toDataURL();
  preview.appendChild(previewImg);

  try {
    const result = await reader.decodeFromCanvas(trimmedCanvas);
    const type = result.getBarcodeFormat();
    const data = result.getText();
    const hash = await sha3(data);

    barcodeList.push([type, data, hash]);
  } catch {
    barcodeList.push(["UNKNOWN", null, null]);
  }
}

function trimWhitespace(img) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);

  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  let minX = c.width, minY = c.height, maxX = 0, maxY = 0;

  for (let i = 0; i < pixels.data.length; i += 4) {
    const alpha = pixels.data[i + 3];
    if (alpha > 0) {
      const x = (i / 4) % c.width;
      const y = Math.floor(i / 4 / c.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX;
  trimmed.height = maxY - minY;
  trimmed
    .getContext("2d")
    .drawImage(c, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);

  return trimmed;
}

async function sha3(text) {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-3-512", enc);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

mintBtn.onclick = () => {
  output.hidden = false;
  output.textContent = JSON.stringify(barcodeList, null, 2);
};

function reset() {
  barcodeList = [];
  preview.innerHTML = "";
  output.hidden = true;
}
