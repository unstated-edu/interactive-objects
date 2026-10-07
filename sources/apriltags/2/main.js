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

	// compute angle from corners
function angle2DFromCorners(det) {
	const dx = det.corners[1].x - det.corners[0].x;
	const dy = det.corners[1].y - det.corners[0].y;
	return (Math.atan2(dy, dx) * 180) / Math.PI; // gradi
}

function rangeMap(value, a, b, c, d) {
	return c + (d - c) * ((value - a) / (b - a));
}

function loop() {
	requestAnimationFrame(loop);

	const detections = getDetections();
	const ids = detections.map((d) => d.id);


	// still process detection 0 as before
	if (ids.includes(0)) {
		const detection = detections.find((det) => det.id === 0);
		const angle = angle2DFromCorners(detection);

		const specimen = document.getElementById("specimen");
		
		//letter spacing
		let newLetterSpacing = 0 + (angle / 180) * 10;

		//apply letter spacing
		specimen.style.letterSpacing = `${newLetterSpacing}px`;
	}
  if (ids.includes(1)) {
	
	  	const detection = detections.find((det) => det.id === 1);
	  	const x = detection.center.x;
    	
		//apply font weight
		let newWeight = rangeMap(x, 400, 800, 80, 200);
		
		//apply font weight
		specimen.style.fontVariationSettings = `'wght' ${newWeight}`;
  }
}


loop();
