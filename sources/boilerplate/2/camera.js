// preset part of the code / dont't change this part
document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("myvideo");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");

  let isVideo = false;
  let model = null;

  setTimeout(function () {
    toggleVideo();
  }, 1000);

  const modelParams = {
    flipHorizontal: true, // flip e.g for video
    maxNumBoxes: 20, // maximum number of boxes to detect
    iouThreshold: 0.5, // ioU threshold for non-max suppression
    scoreThreshold: 0.6, // confidence threshold for predictions.
  };

  function startVideo() {
    handTrack.startVideo(video).then(function (status) {
      console.log("video started", status);
      if (status) {
        isVideo = true;
        runDetection();
      } else {
      }
    });
  }

  function toggleVideo() {
    if (!isVideo) {
      startVideo();
    } else {
      handTrack.stopVideo(video);
      isVideo = false;
    }
  }

  function runDetection() {
    model.detect(video).then((_predictions) => {
      draw(_predictions);
      model.renderPredictions(_predictions, canvas, context, video);
      predictions = _predictions;
      if (isVideo) {
        requestAnimationFrame(runDetection);
      }
    });
  }

  // Load the model.
  handTrack.load(modelParams).then((lmodel) => {
    model = lmodel;
  });
});

function draw(predictions) {
  let xFace, yFace, widthFace, heightFace;
  let textArea = document.getElementById("text-camera");
  let weight = null;

  // if we have predictions / something detected
  if (predictions.length > 0) {
    //
    let face = predictions.find((item) => item.label === "face");

    // if we have a face
    if (face) {
      // get the coordinates of the face and size
      xFace = face.bbox[0];
      yFace = face.bbox[1];
      widthFace = face.bbox[2];
      heightFace = face.bbox[3];

      weight = rangeMap(xFace, 0, 300, 32, 228);
      textArea.style.fontVariationSettings = `'wght' ${weight}`;
    }
  }
}

// map function
function rangeMap(value, a, b, c, d) {
  value = (value - a) / (b - a);
  return c + value * (d - c);
}
