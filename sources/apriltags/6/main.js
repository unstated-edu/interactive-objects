// --- DOM elements ---
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const pickHintEl = document.getElementById("pick-hint");
const colorSlotsEl = document.getElementById("color-slots");

// --- Calibration defaults (HSV, OpenCV scale: H 0–180, S/V 0–255) ---
const calibration = {
  hueTol: 10, // ± hue window around sampled or picked color
  satMin: 80, // ignore weak / gray pixels
  valMin: 80, // ignore very dark pixels
};

// --- Color detectors (mutable: UI updates stroke, text, and ranges) ---
// ranges: array of [lowHSV, highHSV] pairs; red may use two pairs (hue wraps at 0/180)
const colorDetectors = [
  {
    id: "yellow",
    name: "yellow",
    stroke: "#FFD700",
    text: "#FFD700",
    enabled: true,
    ranges: [[[20, 100, 100], [30, 255, 255]]],
  },
  {
    id: "green",
    name: "green",
    stroke: "#00FF00",
    text: "#00FF00",
    enabled: true,
    ranges: [[[40, 50, 50], [80, 255, 255]]],
  },
  {
    id: "red",
    name: "red",
    stroke: "#FF0000",
    text: "#FF0000",
    enabled: true,
    ranges: [
      [[0, 100, 100], [10, 255, 255]],
      [[170, 100, 100], [180, 255, 255]],
    ],
  },
];

// Index of the color slot being calibrated via canvas click, or null
let pickTargetIndex = null;

// --- OpenCV.js bootstrap (called from index.html script onload) ---
window.onOpenCvReady = function () {
  statusEl.textContent = "OpenCV loaded";
  initColorTool();
  startCamera();
};

// --- Webcam ---
async function startCamera() {
  let stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();
    processFrame(); // start the detection loop once frames are available
  };
}

// --- Color conversion helpers ---

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Uses OpenCV so HSV matches cv.inRange (same as video pipeline)
function rgbToOpenCvHsv(r, g, b) {
  let src = cv.matFromArray(1, 1, cv.CV_8UC3, [r, g, b]);
  let hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
  const h = hsv.data[0];
  const s = hsv.data[1];
  const v = hsv.data[2];
  src.delete();
  hsv.delete();
  return { h, s, v };
}

// Build inRange bounds from a center hue; split into two bands near red (wrap)
function hsvRangesFromHue(h, satMin, valMin, hueTol) {
  const sm = satMin;
  const vm = valMin;

  // Hue near 0° (red-orange): combine [0 …] and [… 180]
  if (h <= hueTol) {
    return [
      [[0, sm, vm], [h + hueTol, 255, 255]],
      [[180 - (hueTol - h), sm, vm], [180, 255, 255]],
    ];
  }
  // Hue near 180° (red-magenta): same wrap handling
  if (h >= 180 - hueTol) {
    return [
      [[h - hueTol, sm, vm], [180, 255, 255]],
      [[0, sm, vm], [hueTol - (180 - h), 255, 255]],
    ];
  }
  // Normal case: single contiguous hue interval
  return [[[h - hueTol, sm, vm], [h + hueTol, 255, 255]]];
}

// Sync one detector’s display colors and HSV ranges from a hex swatch
function applyColorToDetector(index, hex) {
  const detector = colorDetectors[index];
  const [r, g, b] = hexToRgb(hex);
  const { h } = rgbToOpenCvHsv(r, g, b);

  detector.stroke = hex;
  detector.text = hex;
  detector.ranges = hsvRangesFromHue(
    h,
    calibration.satMin,
    calibration.valMin,
    calibration.hueTol
  );
}

// Recompute all ranges after global calibration slider changes
function refreshAllDetectorRanges() {
  colorDetectors.forEach((detector, i) => {
    applyColorToDetector(i, detector.stroke);
  });
  renderColorSlots();
}

// --- Color calibration UI ---

function initColorTool() {
  bindCalibrationSlider("hue-tol", "hueTol", refreshAllDetectorRanges);
  bindCalibrationSlider("sat-min", "satMin", refreshAllDetectorRanges);
  bindCalibrationSlider("val-min", "valMin", refreshAllDetectorRanges);

  renderColorSlots();

  // Eyedropper: sample RGB from the current canvas frame (video + overlays)
  canvas.addEventListener("click", (e) => {
    if (pickTargetIndex === null) return;

    // Map click position from CSS size to canvas pixel coordinates
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(
      (e.clientX - rect.left) * (canvas.width / rect.width)
    );
    const y = Math.floor(
      (e.clientY - rect.top) * (canvas.height / rect.height)
    );
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    applyColorToDetector(pickTargetIndex, hex);
    setPickMode(null);
    renderColorSlots();
  });
}

function bindCalibrationSlider(inputId, key, onChange) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(`${inputId}-val`);
  input.addEventListener("input", () => {
    calibration[key] = Number(input.value);
    output.textContent = input.value;
    onChange();
  });
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function setPickMode(index) {
  pickTargetIndex = index;
  const picking = index !== null;
  canvas.classList.toggle("is-picking", picking);
  pickHintEl.hidden = !picking;
  renderColorSlots();
}

function renderColorSlots() {
  colorSlotsEl.innerHTML = "";

  colorDetectors.forEach((detector, index) => {
    const slot = document.createElement("div");
    slot.className = "color-slot";
    if (pickTargetIndex === index) slot.classList.add("is-active");

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = detector.stroke;
    picker.title = `Color for ${detector.name}`;
    picker.addEventListener("input", () => {
      applyColorToDetector(index, picker.value);
    });

    const name = document.createElement("span");
    name.className = "color-slot__name";
    name.textContent = detector.name;

    const enableLabel = document.createElement("label");
    enableLabel.className = "enable";
    const enableCheck = document.createElement("input");
    enableCheck.type = "checkbox";
    enableCheck.checked = detector.enabled;
    enableCheck.addEventListener("change", () => {
      detector.enabled = enableCheck.checked;
    });
    enableLabel.append(enableCheck, document.createTextNode(" Detect"));

    const actions = document.createElement("div");
    actions.className = "color-slot__actions";

    const sampleBtn = document.createElement("button");
    sampleBtn.type = "button";
    sampleBtn.textContent =
      pickTargetIndex === index ? "Cancel sample" : "Sample from video";
    sampleBtn.addEventListener("click", () => {
      setPickMode(pickTargetIndex === index ? null : index);
    });

    actions.append(sampleBtn);

    slot.append(picker, name, enableLabel, actions);
    colorSlotsEl.append(slot);
  });
}

// --- OpenCV mask & drawing ---

// Merge one or more HSV inRange results (e.g. two bands for red)
function buildMask(hsv, rangePairs) {
  let mask = null;

  for (const [lowArr, highArr] of rangePairs) {
    let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [...lowArr, 0]);
    let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [...highArr, 255]);
    let part = new cv.Mat();
    cv.inRange(hsv, low, high, part);
    low.delete();
    high.delete();

    if (!mask) {
      mask = part;
    } else {
      let merged = new cv.Mat();
      cv.bitwise_or(mask, part, merged);
      mask.delete();
      part.delete();
      mask = merged;
    }
  }

  return mask;
}

// Draw min-area rectangle and rotation angle for each contour
function drawDetections(contours, stroke, textColor) {
  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    if (cnt.size().height < 1) continue;

    let rotatedRect = cv.minAreaRect(cnt);
    let vertices = cv.RotatedRect.points(rotatedRect);

    ctx.beginPath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let j = 1; j < 4; j++) {
      ctx.lineTo(vertices[j].x, vertices[j].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${rotatedRect.angle.toFixed(1)}°`,
      rotatedRect.center.x,
      rotatedRect.center.y
    );
  }
}

// --- Main loop ---
function processFrame() {
  // Mirror webcam to canvas (also used as source for cv.imread)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let src = cv.imread(canvas);
  let hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  // Run detection per color so stroke/text stay matched to each hue
  for (const detector of colorDetectors) {
    if (!detector.enabled) continue;

    let mask = buildMask(hsv, detector.ranges);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(
      mask,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    drawDetections(contours, detector.stroke, detector.text);

    // Free OpenCV mats allocated this frame
    mask.delete();
    contours.delete();
    hierarchy.delete();
  }

  src.delete();
  hsv.delete();

  requestAnimationFrame(processFrame);
}
