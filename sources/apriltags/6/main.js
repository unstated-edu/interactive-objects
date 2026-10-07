// --- Typography (student exercise) ---
const specimenEl = document.getElementById("specimen");
const wghtReadoutEl = document.getElementById("wght-readout");

// Unica77 VIP Beta — same range as apriltags/9
const WGHT_MIN = 32;
const WGHT_MAX = 228;
const WGHT_DEFAULT = 130;
const WGHT_SMOOTH = 0.35;

let smoothWght = WGHT_DEFAULT;



//set specimen weight
function setSpecimenWeight(wght) {
  //round to nearest integer
  const rounded = Math.min(
    WGHT_MAX,
    Math.max(WGHT_MIN, Math.round(wght))
  );
  //apply font weight
  specimenEl.style.fontVariationSettings = `'wght' ${rounded}`;
  //display font weight
  wghtReadoutEl.textContent = `'wght' ${rounded}`;
}

//range map
function rangeMap(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  const clamped = Math.min(1, Math.max(0, t));
  return outMin + (outMax - outMin) * clamped;
}

//on track frame
function onTrackFrame({ center, canvasWidth }) {

  //if no center, set smooth weight to default
  if (!center) {
    smoothWght += (WGHT_DEFAULT - smoothWght) * WGHT_SMOOTH;
    setSpecimenWeight(smoothWght);
    return;
  }

  // Left on canvas = lighter, right = heavier
  const targetWght = rangeMap(
    center.x,
    0,
    canvasWidth,
    WGHT_MIN,
    WGHT_MAX
  );

  //apply smooth weight
  smoothWght += (targetWght - smoothWght) * WGHT_SMOOTH;
  //apply specimen weight
  setSpecimenWeight(smoothWght);
}

// --- Wire OpenCV tracking (see color-tracking.js) ---
ColorTracking.init({
  onReady() {
    setSpecimenWeight(WGHT_DEFAULT);
  },
  onFrame: onTrackFrame,
});
