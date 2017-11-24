var cameraInput = document.getElementById('cameraInput');
var objectInput = document.getElementById('objectInput');
var ligntInput = document.getElementById('lightInput');
var submitButton = document.getElementById('submitButton');

var cameraData = [];
var objectData = [];
var lightData = [];

function setupCamera(){
    var reader = new FileReader();

    reader.onload = function(e) {
        cameraData = reader.result.split(\n);
    }

    reader.readAsText(file, encoding);
}

submitButton.addEventListenner('click', e => {
    setupCamera();
    console.log(cameraData);
});
