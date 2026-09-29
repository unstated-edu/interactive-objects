let container = document.querySelector("#container");
container.addEventListener("click", function (e) {
  console.log(e);
  container.classList.toggle("rotateAndScale");
});
