let value = document.getElementById("value");
let textArea = document.getElementById("text");
let weight = null;
function update() {
  requestAnimationFrame(update);
  value.innerHTML = sound;
  weight = rangeMap(sound, 0, 80, 32, 228);
  textArea.style.fontVariationSettings = `'wght' ${weight}`;
}
update();


function rangeMap(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
