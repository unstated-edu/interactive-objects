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

function remap(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}



function loop() {
  requestAnimationFrame(loop);

  const detections = getDetections();
  const specimen = document.getElementById("specimen");
  specimen.innerHTML = ""; // Clear previous content

  detections.forEach((det) => {
    const { id, center } = det;
    const resultX = remap(center.x, 350, 950, 0, 1920);
    const line = `ID: ${id} → x: ${resultX}, y: ${center.y.toFixed(
      1
    )} deg: ${angle2DFromCorners(det).toFixed(1)} `;
    const p = document.createElement("div");
    p.textContent = line;
    specimen.appendChild(p);
  });
}

loop();
