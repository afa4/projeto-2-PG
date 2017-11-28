var cameraInput = document.getElementById('cameraInput');
var objectInput = document.getElementById('objectInput');
var ligntInput = document.getElementById('lightInput');
var submitButton = document.getElementById('submitButton');

var cameraData = [];
var objectData = [];
var lightData = [];
var camera = {};

function setupCamera(){
    var reader = new FileReader();

    reader.onload = function(e) {
        cameraData = reader.result.split('\n');
        var fileLine = cameraData[0].split(' ');
        camera.x = Number(fileLine[0]);
        camera.y = Number(fileLine[1]);
        camera.z = Number(fileLine[2]);
        fileLine = cameraData[1].split(' ');
        camera.N = {};
        camera.N.x = Number(fileLine[0]);
        camera.N.y = Number(fileLine[1]);
        camera.N.z = Number(fileLine[2]);
        fileLine = cameraData[2].split(' ');
        camera.V = {};
        camera.V.x = Number(fileLine[0]);
        camera.V.y = Number(fileLine[1]);
        camera.V.z = Number(fileLine[2]);
        fileLine = cameraData[3].split(' ');
        camera.d = Number(fileLine[0]);
        camera.hx = Number(fileLine[1]);
        camera.hy = Number(fileLine[2]);
    }
    var file = cameraInput.files[0];
    reader.readAsText(file);
}

submitButton.addEventListener('click', e => {
    setupCamera();
    console.log(camera);
});
