import { getDetections } from "./assets/video_process.js";

//DOM elements
const video = (window.video = document.getElementById("webcam_canvas"));
const canvas = (window.canvas = document.getElementById("out_canvas"));

//dimensions for canvas
canvas.width = 480;
canvas.height = 360;

//constraints for webcam
const constraints = {
  audio: false,
  video: true,
  video: { width: 1280, height: 720 },
};

//success
function handleSuccess(stream) {
  window.stream = stream;
  video.srcObject = stream;
}

//potential error
function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}
//webcam
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(handleSuccess)
  .catch(handleError);

function angle2DFromCorners(det) {
  const dx = det.corners[1].x - det.corners[0].x;
  const dy = det.corners[1].y - det.corners[0].y;
  return (Math.atan2(dy, dx) * 180) / Math.PI; // gradi
}

setTimeout(() => {
  document.getElementById("specimen").innerHTML = "PIZZA";
}, 4000);
function loop() {
  requestAnimationFrame(loop);

  const detections = getDetections();
  const ids = detections.map((d) => d.id);

  // still process detection 0 as before
  if (ids.includes(0)) {
    const detection = detections.find((det) => det.id === 0);
    const angle = angle2DFromCorners(detection);

    const specimen = document.getElementById("specimen");
    const newWeight = 100 + (angle / 180) * 100;
    const newLetterSpacing = 0 + (angle / 180) * 10;

    specimen.style.fontVariationSettings = `'wght' ${newWeight}`;
    specimen.style.letterSpacing = `${newLetterSpacing}px`;
  }

  if (ids.includes(1)) {
    const detection1 = detections.find((det) => det.id === 1);
    const angle1 = angle2DFromCorners(detection1); // -180° to 180°

    // Normalize to 0–360°
    const angleNorm = (angle1 + 360) % 360;

    // Determine index (0 to 7 for every 45°)
    const segmentIndex = Math.floor(angleNorm / 45);

    // Define your content list
    const contentList = [
      "Salut",
      "Bonjour",
      "Guten Tag",
      "Konnichiwa",
      "Hallo",
      "Ciao",
      "Hola",
      "Hej",
    ];

    // Optional: avoid constant DOM updates by storing the last index
    if (specimen.dataset.lastIndex !== String(segmentIndex)) {
      specimen.textContent = contentList[segmentIndex];
      specimen.dataset.lastIndex = segmentIndex;
    }
  }
}

loop();
