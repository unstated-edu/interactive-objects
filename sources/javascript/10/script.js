let i = 0; // Index for characters in a string
let arrIndex = 0; // Index for strings in the array
let txtArray = ["Unica77", "Brown", "Ruder", "Geigy Duplex", "Riforma Mono"]; // Array of strings
let speed = 10; // Typing speed

function typeWriter() {
  //if the index is less than the length of the string
  if (arrIndex < txtArray.length) {
    //if the index is less than the length of the string
    if (i < txtArray[arrIndex].length) {
      document.getElementById("textTypeWriting").innerHTML +=
        txtArray[arrIndex].charAt(i); //add the character to the string
      i++; //increment the index by 1
      setTimeout(typeWriter, speed); // call the function again after the speed
    }
    //otherwise, start deleting the text
    else {
      setTimeout(typeDelete, 1000); // Start deleting after the text is typed
    }
  }
  //otherwise, reset the index and start typing again
  else {
    arrIndex = 0; // Reset to first string in array after last one is deleted
    setTimeout(typeWriter, 1000); // Loop back to start typing again
  }
}

function typeDelete() {
  if (i > 0) {
    // Delete the character at the index i
    document.getElementById("textTypeWriting").innerHTML = txtArray[
      arrIndex
    ].substring(0, i - 1);
    i--;
    setTimeout(typeDelete, speed);
  } else {
    arrIndex++; // Move to the next string in the array
    setTimeout(typeWriter, 1000); // Wait a bit before starting to type the next string
  }
}

setTimeout(typeWriter, 1000);
