let textArea = document.getElementById('text');
let weight = null;
let slant = null;
let width = null;

// Weight  
const fontWeightRangeInput = document.getElementById('fontWeight');
const fontWeightRangeInputValue = document.getElementById('fontWeightValue');

function updateFontWeight() {
  weight = fontWeightRangeInput.value;
  textArea.style.fontVariationSettings = `'wght' ${weight}, 'slnt' ${slant}, 'wdth' ${width}`;
  fontWeightRangeInputValue.textContent = weight;
}

fontWeightRangeInput.addEventListener('input', updateFontWeight);
updateFontWeight();

// Slant  
const fontSlantRangeInput = document.getElementById('fontSlant');
const fontSlantRangeInputValue = document.getElementById('fontSlantValue');

function updateSlantWeight() {
  slant = fontSlantRangeInput.value;
  textArea.style.fontVariationSettings = `'wght' ${weight}, 'slnt' ${slant}, 'wdth' ${width}`;
  fontSlantRangeInputValue.textContent = slant;
}
fontSlantRangeInput.addEventListener('input', updateSlantWeight);
updateSlantWeight(); // Fixed to call the correct function for initialization


//Width
const fontWidthRangeInput = document.getElementById('fontWidth');
const fontWidthRangeInputValue = document.getElementById('fontWidthValue');

function updateWidthWeight() {
  width = fontWidthRangeInput.value;
  textArea.style.fontVariationSettings = `'wght' ${weight}, 'slnt' ${slant}, 'wdth' ${width}`;
  fontWidthRangeInputValue.textContent = width;
}
fontWidthRangeInput.addEventListener('input', updateWidthWeight);
updateWidthWeight(); // Fixed to call the correct function for initialization
