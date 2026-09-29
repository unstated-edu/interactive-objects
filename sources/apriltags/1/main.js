import { getDetections } from "./assets/video_process.js";

// --- DOM elements ---
const video = (window.video = document.getElementById("webcam_canvas"));
const canvas = (window.canvas = document.getElementById("out_canvas"));
const ctx = canvas.getContext("2d");

// --- Canvas setup ---
canvas.width = 640;
canvas.height = 480;

// --- Webcam constraints ---
const constraints = {
	audio: false,
	video: {
		width: { ideal: 640 },
		height: { ideal: 480 },
		frameRate: { ideal: 60, max: 60 },
		facingMode: "environment",
	},
};

// --- Init webcam ---
navigator.mediaDevices.getUserMedia(constraints)
	.then((stream) => {
		video.srcObject = stream;
		video.onloadedmetadata = () => {
			video.play();
			loop(); // start the loop when the video is ready
		};
	})
	.catch((error) => {
		console.error("Webcam error:", error.message);
	});

// --- Helpers ---
function angle2DFromCorners(det) {
	const dx = det.corners[1].x - det.corners[0].x;
	const dy = det.corners[1].y - det.corners[0].y;
	return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getCenterFromDetection(det) {
	const sum = det.corners.reduce(
		(acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
		{ x: 0, y: 0 }
	);
	return { x: sum.x / det.corners.length, y: sum.y / det.corners.length };
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function drawCorners(corners, alpha = 1) {
	if (!corners || corners.length !== 4) return;
	ctx.beginPath();
	ctx.moveTo(corners[0].x, corners[0].y);
	ctx.lineTo(corners[1].x, corners[1].y);
	ctx.lineTo(corners[2].x, corners[2].y);
	ctx.lineTo(corners[3].x, corners[3].y);
	ctx.closePath();
	ctx.strokeStyle = `rgba(0,0,255,${alpha})`;
	ctx.lineWidth = 2;
	ctx.stroke();
}

// --- Stable state by tag ID ---
const stableMap = {}; // { id: { angle, x, y, corners, lastUpdate } }

const detectionMemoryDuration = 2000; // how long to keep a tag visible after last detection (ms)
const smoothingFactor = 0.15; // 0.1 = very smooth, 0.3 = more responsive

// --- MAIN LOOP ---
function loop() {
	requestAnimationFrame(loop);

	if (video.readyState < 2) return;

	const now = Date.now();
	const detections = getDetections() || [];

	// semi-transparent fill for trail effect
	ctx.fillStyle = "rgba(0,0,0,0.25)"; // higher alpha = faster trail fade
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// draw video with slight transparency
	ctx.globalAlpha = 0.9;
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = 1.0;

	// update stable state for each detected tag
	detections.forEach((det) => {
		const id = det.id;
		const angle = angle2DFromCorners(det);
		const center = getCenterFromDetection(det);

		if (!stableMap[id]) {
			// new tag
			stableMap[id] = {
				angle,
				x: center.x,
				y: center.y,
				corners: det.corners.map((pt) => ({ x: pt.x, y: pt.y })),
				lastUpdate: now,
			};
		} else {
			// smoothing
			const s = stableMap[id];
			s.angle = lerp(s.angle, angle, smoothingFactor);
			s.x = lerp(s.x, center.x, smoothingFactor);
			s.y = lerp(s.y, center.y, smoothingFactor);

			s.corners = s.corners.map((prev, i) => ({
				x: lerp(prev.x, det.corners[i].x, smoothingFactor),
				y: lerp(prev.y, det.corners[i].y, smoothingFactor),
			}));

			s.lastUpdate = now;
		}
	});

	// draw all tags still held in memory
	Object.entries(stableMap).forEach(([id, s]) => {
		const age = now - s.lastUpdate;
		if (age < detectionMemoryDuration) {
			const alpha = Math.max(0.1, 1 - age / detectionMemoryDuration);
			drawCorners(s.corners, alpha);

			// label with tag ID and angle
			ctx.fillStyle = `rgba(0,0,255,${alpha})`;
			ctx.font = "bold 16px Arial";
			ctx.textAlign = "center";
			ctx.fillText(`ID ${id}`, s.x, s.y - 10);
			ctx.fillText(`${s.angle.toFixed(1)}°`, s.x, s.y + 10);
		}
	});
}
