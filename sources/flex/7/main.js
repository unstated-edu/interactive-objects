//if dom ready, add event listener to the body to check if the screen is mobile
document.addEventListener("DOMContentLoaded", () => {
    const gridItem1Text = document.querySelector("#grid-item-1-text");

    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let i = 0;
    //everyseconds innerHtml next char alphabetically
    setInterval(() => {
        gridItem1Text.innerHTML = alphabet[i];
        i++;
        if (i >= alphabet.length) {
            i = 0;
        }
    }, 1000);

});