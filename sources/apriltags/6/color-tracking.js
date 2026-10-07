/**
 * OpenCV color detection + webcam + calibration UI.
 * Students: edit main.js — map blob position to typography here via onFrame().
 */
const ColorTracking = (() => {
  const MIN_BLOB_AREA = 800;

  const calibration = {
    hueTol: 10,
    satMin: 80,
    valMin: 80,
  };

  const colorDetector = {
    id: "target",
    name: "target color",
    stroke: "#FFD700",
    enabled: true,
    ranges: [[[20, 100, 100], [30, 255, 255]]],
  };

  let video;
  let canvas;
  let ctx;
  let statusEl;
  let pickHintEl;
  let colorSlotEl;

  let isPicking = false;
  let trackedCenter = null;
  let smoothCenter = null;
  let trackedContourIndex = -1;
  let trackAnchor = null;

  let onReady = () => {};
  let onFrame = () => {};

  function copyPoint(p) {
    return { x: p.x, y: p.y };
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function rgbToOpenCvHsv(r, g, b) {
    let src = cv.matFromArray(1, 1, cv.CV_8UC3, [r, g, b]);
    let hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
    const h = hsv.data[0];
    src.delete();
    hsv.delete();
    return { h };
  }

  function hsvRangesFromHue(h, satMin, valMin, hueTol) {
    const sm = satMin;
    const vm = valMin;

    if (h <= hueTol) {
      return [
        [[0, sm, vm], [h + hueTol, 255, 255]],
        [[180 - (hueTol - h), sm, vm], [180, 255, 255]],
      ];
    }
    if (h >= 180 - hueTol) {
      return [
        [[h - hueTol, sm, vm], [180, 255, 255]],
        [[0, sm, vm], [hueTol - (180 - h), 255, 255]],
      ];
    }
    return [[[h - hueTol, sm, vm], [h + hueTol, 255, 255]]];
  }

  function applyColorToDetector(hex) {
    const [r, g, b] = hexToRgb(hex);
    const { h } = rgbToOpenCvHsv(r, g, b);

    colorDetector.stroke = hex;
    colorDetector.ranges = hsvRangesFromHue(
      h,
      calibration.satMin,
      calibration.valMin,
      calibration.hueTol
    );
  }

  function refreshDetectorRanges() {
    applyColorToDetector(colorDetector.stroke);
    renderColorSlot();
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

  function setPickMode(picking) {
    isPicking = picking;
    canvas.classList.toggle("is-picking", picking);
    pickHintEl.hidden = !picking;
    renderColorSlot();
  }

  function renderColorSlot() {
    colorSlotEl.innerHTML = "";

    const slot = document.createElement("div");
    slot.className = "color-slot";
    if (isPicking) slot.classList.add("is-active");

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = colorDetector.stroke;
    picker.title = "Target color";
    picker.addEventListener("input", () => {
      applyColorToDetector(picker.value);
    });

    const name = document.createElement("span");
    name.className = "color-slot__name";
    name.textContent = colorDetector.name;

    const enableLabel = document.createElement("label");
    enableLabel.className = "enable";
    const enableCheck = document.createElement("input");
    enableCheck.type = "checkbox";
    enableCheck.checked = colorDetector.enabled;
    enableCheck.addEventListener("change", () => {
      colorDetector.enabled = enableCheck.checked;
    });
    enableLabel.append(enableCheck, document.createTextNode(" Detect"));

    const actions = document.createElement("div");
    actions.className = "color-slot__actions";

    const sampleBtn = document.createElement("button");
    sampleBtn.type = "button";
    sampleBtn.textContent = isPicking ? "Cancel sample" : "Sample from video";
    sampleBtn.addEventListener("click", () => {
      setPickMode(!isPicking);
    });

    actions.append(sampleBtn);
    slot.append(picker, name, enableLabel, actions);
    colorSlotEl.append(slot);
  }

  function initColorTool() {
    bindCalibrationSlider("hue-tol", "hueTol", refreshDetectorRanges);
    bindCalibrationSlider("sat-min", "satMin", refreshDetectorRanges);
    bindCalibrationSlider("val-min", "valMin", refreshDetectorRanges);

    renderColorSlot();

    canvas.addEventListener("click", (e) => {
      const { x, y } = canvasPointFromClick(e.clientX, e.clientY);

      if (isPicking) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        applyColorToDetector(hex);
        trackAnchor = { x, y };
        trackedCenter = null;
        smoothCenter = null;
        setPickMode(false);
        renderColorSlot();
        return;
      }

      trackAnchor = { x, y };
      trackedCenter = null;
      smoothCenter = null;
    });
  }

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

  function refineMask(mask) {
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(7, 7));
    const refined = new cv.Mat();
    cv.morphologyEx(mask, refined, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(refined, refined, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    return refined;
  }

  function collectBlobCandidates(contours) {
    const list = [];
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < MIN_BLOB_AREA) continue;
      const rotatedRect = cv.minAreaRect(cnt);
      list.push({ index: i, area, center: copyPoint(rotatedRect.center) });
    }
    return list;
  }

  function pickTrackedBlob(candidates) {
    if (!candidates.length) return null;

    const anchor =
      smoothCenter ||
      trackedCenter ||
      trackAnchor || {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };

    let best = null;
    let bestDist = Infinity;

    for (const blob of candidates) {
      const dist = Math.hypot(
        blob.center.x - anchor.x,
        blob.center.y - anchor.y
      );
      if (dist < bestDist) {
        bestDist = dist;
        best = blob;
      }
    }

    return best;
  }

  function drawTrackedContour(contours, index, stroke) {
    if (index < 0 || index >= contours.size()) return;

    const cnt = contours.get(index);
    if (cnt.size().height < 1) return;

    const rotatedRect = cv.minAreaRect(cnt);
    const vertices = cv.RotatedRect.points(rotatedRect);

    ctx.beginPath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let j = 1; j < 4; j++) {
      ctx.lineTo(vertices[j].x, vertices[j].y);
    }
    ctx.closePath();
    ctx.stroke();

    const cx = rotatedRect.center.x;
    const cy = rotatedRect.center.y;
    const label = `x: ${Math.round(cx)}, y: ${Math.round(cy)}`;
    let labelX = cx;
    let labelY =
      Math.min(vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y) - 6;

    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    if (labelY < 16) {
      labelY =
        Math.max(vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y) +
        16;
      ctx.textBaseline = "top";
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.strokeText(label, labelX, labelY);
    ctx.fillStyle = stroke;
    ctx.fillText(label, labelX, labelY);
  }

  function drawMirroredVideo() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function canvasPointFromClick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const displayX = (clientX - rect.left) * (canvas.width / rect.width);
    const displayY = (clientY - rect.top) * (canvas.height / rect.height);
    return {
      x: Math.floor(canvas.width - displayX),
      y: Math.floor(displayY),
    };
  }

  function processFrame() {
    drawMirroredVideo();
    let src = cv.imread(canvas);
    let hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    let center = null;

    if (colorDetector.enabled) {
      let mask = buildMask(hsv, colorDetector.ranges);
      let refined = refineMask(mask);
      mask.delete();

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(
        refined,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      const candidates = collectBlobCandidates(contours);
      const blob = pickTrackedBlob(candidates);
      trackedContourIndex = blob ? blob.index : -1;

      if (blob) {
        center = copyPoint(blob.center);
        trackedCenter = center;
        smoothCenter = center;
      }

      drawTrackedContour(contours, trackedContourIndex, colorDetector.stroke);

      refined.delete();
      contours.delete();
      hierarchy.delete();
    }

    src.delete();
    hsv.delete();

    onFrame({
      center,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    });

    requestAnimationFrame(processFrame);
  }

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      processFrame();
    };
  }

  function bootOpenCv() {
    statusEl.textContent = "OpenCV loaded";
    initColorTool();
    onReady();
    startCamera();
  }

  return {
    /**
     * @param {{ onReady?: () => void, onFrame?: (track: { center: {x:number,y:number}|null, canvasWidth: number, canvasHeight: number }) => void }} hooks
     */
    init(hooks = {}) {
      video = document.getElementById("video");
      canvas = document.getElementById("canvas");
      ctx = canvas.getContext("2d");
      statusEl = document.getElementById("status");
      pickHintEl = document.getElementById("pick-hint");
      colorSlotEl = document.getElementById("color-slot");

      onReady = hooks.onReady || onReady;
      onFrame = hooks.onFrame || onFrame;

      window.onOpenCvReady = bootOpenCv;
    },
  };
})();
