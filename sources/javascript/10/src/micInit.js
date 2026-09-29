let sound = 0;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
  navigator.getUserMedia(
    {
      audio: true,
    },
    function (stream) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = function () {
        let array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        let length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }
        sound = values / length;
        sound = Math.round(sound);
        // console.log("set" + Math.round(sound));
      }; // end fn stream
    },
    function (err) {
      console.log("The following error occured: " + err.name);
    }
  );
} else {
  console.log("getUserMedia not supported");
}
