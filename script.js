var cameraInput = document.getElementById('cameraInput');
var objectInput = document.getElementById('objectInput');
var ligntInput = document.getElementById('lightInput');
var submitButton = document.getElementById('submitButton');

var points = [];
var pointNormals = [];
var triangles = [];
var light = {};
var camera = {};

class Point {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  // Produto Escalar
  dotProduct(v) {
    return (this.x * v.x) + (this.y * v.y) + (this.z * v.z);
  }
  // Produto Vetorial
  crossProduct(v) {
    return new Point(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
  }
  mult(n) {
    return new Point(n * this.x, n * this.y, n * this.z);
  }
  sub(v) {
    return new Point(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  // Projetar v no ponto em questão
  proj(v) {
    var dotsResult = v.dotProduct(this) / this.dotProduct(this);
    return this.mult(dotsResult);
  }
  normalize() {
    var norm = Math.sqrt(this.dotProduct(this));
    var v = this.mult(1/norm);
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  adaptView() {
    return new Point(this.x * camera.U.x + this.y * camera.U.y + this.z * camera.U.z,
       this.x * camera.V.x + this.y * camera.V.y + this.z * camera.V.z,
       this.x * camera.N.x + this.y * camera.N.y + this.z * camera.N.z);
  }
}

class Triangle{
  constructor(p1, p2, p3){
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
}

function setupCamera(){
    var reader = new FileReader();

    reader.onload = function(e) {
        var cameraData = reader.result.split('\n');
        var fileLine = cameraData[0].split(' ');
        camera.Pos = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        fileLine = cameraData[1].split(' ');
        camera.N = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        fileLine = cameraData[2].split(' ');
        camera.V = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        // Ortogonizar vetor V
        camera.V = camera.V.sub(camera.N.proj(camera.V));
        fileLine = cameraData[3].split(' ');
        camera.d = Number(fileLine[0]);
        camera.hx = Number(fileLine[1]);
        camera.hy = Number(fileLine[2]);
        // Normalizar V e N para calcular U já normalizado
        camera.V.normalize();
        camera.N.normalize();
        camera.U = camera.N.crossProduct(camera.V);
    }
    var file = cameraInput.files[0];
    reader.readAsText(file);
}

function setupObject() {
    var reader = new FileReader();
    reader.onload = function(e) {
      var objectData = reader.result.split('\n');
      var fileLine = objectData[0].split(' ');
      var nPoints = Number(fileLine[0]);
      var nTri = Number(fileLine[1]);
      for (var i = 1; i <= nPoints; i++) {
        fileLine = objectData[i].split(' ');
        var xPoint = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        points[i-1] = xPoint.adaptView();
      }
      for (var i = nPoints + 1; i <= nPoints + nTri; i++) {
        fileLine = objectData[i].split(' ');
        triangles[i - nPoints - 1] = new Triangle(Number(fileLine[0]) - 1, Number(fileLine[1]) - 1, Number(fileLine[2]) - 1);
      }
    }
    var file = objectInput.files[0];
    reader.readAsText(file);
}

function setupLight(){
    var reader = new FileReader();
    reader.onload = function(e){
        var lightData = reader.result.split('\n');
        var fileLine = lightData[0].split(' ');
        var lPos = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.Pos = lPos.adaptView();
        light.ka = Number(lightData[1]);
        fileLine = lightData[2].split(' ')
        light.ia = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.kd = Number(lightData[3]);
        fileLine = lightData[4].split(' ')
        light.od = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.ks = Number(lightData[5]);
        fileLine = lightData[6].split(' ');
        light.il = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.n = Number(lightData[7]);
    }
    var file = lightInput.files[0];
    reader.readAsText(file);
}

function setupNormals(){
    var normals = [];
    for (var i = 0; i < triangles.length; i++) {
        var a = points[triangles[i].p1];
        var b = points[triangles[i].p2];
        var c = points[triangles[i].p3];

        var v1 = a.sub(b);
        var v2 = a.sub(c);

        var normal = v1.crossProduct(v2).normalize();

        normals[triangles[i].p1] += normal;
        normals[triangles[i].p2] += normal;
        normals[triangles[i].p3] += normal;
    }
    return normals;
}

submitButton.addEventListener('click', e => {
    setupCamera();
    setupObject();
    setupLight();
    setupNormals();
});
