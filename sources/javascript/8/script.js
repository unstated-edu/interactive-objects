function draw(predictions) {
  let xFace, yFace, widthFace, heightFace;
  let textArea = document.getElementById("text");
  let slnt = null;
  if (predictions.length > 0) {
    let face = predictions.find((item) => item.label === "face");

    // if we have a face
    if (face) {
      // get the coordinates of the face and size
      xFace = face.bbox[0];
      yFace = face.bbox[1];

      // map the coordinates of the face from the canvas to the window

      document.getElementById("x").innerHTML = xFace;
      document.getElementById("y").innerHTML = yFace;

      //face position
      slnt = rangeMap(xFace, 100, 450, 0, 24);

      textArea.style.fontVariationSettings = `'slnt' ${slnt}`;

    }
  }
}

// map function
function rangeMap(value, a, b, c, d) {
  value = (value - a) / (b - a);
  return c + value * (d - c);
}
