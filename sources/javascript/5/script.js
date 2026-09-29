let textArea = document.getElementById('text');
let weight = null;

//chante the weight regarding the dimsnions of the window with resize event
//use a range map function to map the window width to the font weight
window.addEventListener('resize', () => {
  weight = rangeMap(window.innerWidth, 500, 1300, 32, 228);

  textArea.style.fontVariationSettings = `'wght' ${weight}`;
});

function rangeMap(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
