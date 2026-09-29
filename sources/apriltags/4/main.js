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

function loop() {
  requestAnimationFrame(loop);

  const detections = getDetections();
  const ids = detections.map((d) => d.id);

  // check for ID 0 and 1
  if (ids.includes(0) && ids.includes(1)) {
    const det0 = detections.find((d) => d.id === 0);
    const det1 = detections.find((d) => d.id === 1);

    // compute distance between centers
    const dx = det0.center.x - det1.center.x;
    const dy = det0.center.y - det1.center.y;

    // calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);


    // (Optional) Use this distance to modify style or interaction
    const specimen = document.getElementById("specimen");
    const scale = 1 + distance / 500; // adjust divisor to your needs
    specimen.style.transform = `scale(${scale})`;
    specimen.textContent = distance.toFixed(2);

    //change audio volume
    const audio = document.getElementById("audio");
    audio.volume = distance / 1000;

  }

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
}

loop();
