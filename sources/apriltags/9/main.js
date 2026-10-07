// MediaPipe Hands: 21 landmarks.
// Fingertips: 4 thumb, 8 index, 12 middle, 16 ring, 20 pinky
// https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
const THUMB_TIP = 4;
const INDEX_TIP = 8;

// Fingertips only. Each name maps to one MediaPipe landmark.
const FINGERS = [
	["thumb", 4],
	["index", 8],
	["middle", 12],
	["ring", 16],
	["pinky", 20],
];

// Unica has one axis we drive here: wght 32–228
const WGHT_MIN = 32;
const WGHT_MAX = 228;

// Pinch distance is normalized (0–1 of the frame), not pixels
const DIST_CLOSED = 0.03;
const DIST_OPEN = 0.22;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const specimenEl = document.getElementById("specimen");
const readoutEl = document.getElementById("wght-readout");
const statusEl = document.getElementById("status");

let currentWght = WGHT_MIN;



// x and y are normalized (0–1), same values as the landmarks
function logFingers(landmarks) {
	for (const [name, index] of FINGERS) {
		const point = landmarks[index];
		console.log(name, point.x.toFixed(2), point.y.toFixed(2));
	}
}

// Calculate the distance between the thumb and index tips
function pinchDistance(landmarks) {
	const thumb = landmarks[THUMB_TIP];
	const index = landmarks[INDEX_TIP];
	const dx = thumb.x - index.x;
	const dy = thumb.y - index.y;
	return Math.hypot(dx, dy);
}


function drawPinch(landmarks) {
	const thumb = landmarks[THUMB_TIP];
	const index = landmarks[INDEX_TIP];

	// Normalize the coordinates to the canvas size
	const x1 = thumb.x * canvas.width;
	const y1 = thumb.y * canvas.height;
	const x2 = index.x * canvas.width;
	const y2 = index.y * canvas.height;

	ctx.strokeStyle = "#8221ff";
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	ctx.fillStyle = "#8221ff";
	for (const [x, y] of [[x1, y1], [x2, y2]]) {
		ctx.beginPath();
		ctx.arc(x, y, 8, 0, Math.PI * 2);
		ctx.fill();
	}
}

// Draw the landmarks and the pinch distance
// Variants of the typeface here
function onResults(results) {
	ctx.save();
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Mirror the frame so the camera behaves like a mirror
	ctx.translate(canvas.width, 0);
	ctx.scale(-1, 1);
	ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

	// Get the hands and draw the landmarks and the pinch distance
	const hands = results.multiHandLandmarks;

	// If there are hands, draw the landmarks and the pinch distance
	if (hands && hands.length > 0) {
		for (const landmarks of hands) {
			logFingers(landmarks);

			// Draw the landmarks
			drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
				color: "#ffffff",
				lineWidth: 2,
			});

			// Draw the pinch distance
			drawPinch(landmarks);
		}

		// Weight follows the first hand so the second does not overwrite it
		const distance = pinchDistance(hands[0]);

		// Map the distance to the weight range
		const wght = rangeMap(distance, DIST_CLOSED, DIST_OPEN, WGHT_MIN, WGHT_MAX);

		// Set the weight based on the distance
		setWeight(wght);

		// Update the status text
		statusEl.textContent = "Open thumb and index to increase the weight.";
	}

	ctx.restore();
}

function start() {
	const hands = new Hands({
		locateFile: (file) =>
			`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
	});

	hands.setOptions({
		maxNumHands: 2,
		modelComplexity: 1,
		minDetectionConfidence: 0.7,
		minTrackingConfidence: 0.6,
	});

	hands.onResults(onResults);

	const camera = new Camera(video, {
		onFrame: async () => {
			await hands.send({ image: video });
		},
		width: 640,
		height: 480,
	});

	setWeight(WGHT_MIN);
	camera.start()
		.then(() => {
			statusEl.textContent = "Show both hands. Open thumb and index to increase the weight.";
		})
		.catch(() => {
			statusEl.textContent = "Camera blocked. Allow the webcam and reload.";
		});
}

function rangeMap(value, inMin, inMax, outMin, outMax) {
	if (inMax === inMin) return outMin;
	const t = (value - inMin) / (inMax - inMin);
	const clamped = Math.min(1, Math.max(0, t));
	return outMin + (outMax - outMin) * clamped;
}

function setWeight(target) {
	// Ease toward the new value so the type does not flicker
	currentWght += (target - currentWght) * 0.35;
	const wght = Math.round(currentWght);

	// Set the weight based on the distance
	specimenEl.style.fontVariationSettings = `'wght' ${wght}`;
	readoutEl.textContent = `'wght' ${wght}`;
}


start();
