let previewChar = document.querySelector("#preview-char");
let previewInfo = document.querySelector("#preview-info");
let previewInfo2 = document.querySelector("#preview-info-2");
let previewCharSpan = document.querySelector("#preview-char-span");

let chars = document.querySelectorAll(".char");

chars.forEach((char) => {
  char.addEventListener("mouseenter", () => {
    //take the content od the div and put it in the preview
    
    previewCharSpan.innerHTML = char.innerHTML;
    //take info from the data-info attribute and put it in the preview
    previewInfo.innerHTML = char.getAttribute("data-info");
    previewInfo2.innerHTML = char.getAttribute("data-info2");
  });
  char.addEventListener("mouseleave", () => {
    //clear the preview
    previewCharSpan.innerHTML = "";
    previewInfo.innerHTML = "";
    previewInfo2.innerHTML = "";
  });
});
