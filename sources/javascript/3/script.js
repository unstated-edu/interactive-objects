let value = document.getElementById('value');
function update() {
  requestAnimationFrame(update);
  value.innerHTML = sound;
}
update();
