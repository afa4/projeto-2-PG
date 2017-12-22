var cameraInput = document.getElementById('cameraInput');
var objectInput = document.getElementById('objectInput');
var ligntInput = document.getElementById('lightInput');
var submitButton = document.getElementById('submitButton');

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var height = 703;
var width = 1346;

var points = [];
var points2d = [];
var pointNormals = [];
var triangles = [];
var zb = []; // Array zbuffer
var light = {};
var camera;
var triangleIndex;
var objects = 1;


class Camera {
  constructor(Pos, N, V, d, hx, hy, U) {
    this.Pos = Pos;
    this.N = N;
    this.V = V;
    this.d = d;
    this.hx = hx;
    this.hy = hy;
    this.U = U;
  }  
}

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
  multVectors(v){
    return new Point (this.x * v.x, this.y * v.y, this.z * v.z);
  }
  sub(v) {
    return new Point(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  sum(v) {
    return new Point(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  // Projetar v no ponto em questão
  proj(v) {
    var dotsResult = v.dotProduct(this) / this.dotProduct(this);
    return this.mult(dotsResult);
  }
  norm() {
    return Math.sqrt(this.dotProduct(this));
  }
  normalize() {
    var v = this.mult(1/this.norm());
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  adaptView() {
    let temp = this.sub(camera.Pos);
    return new Point(temp.x * camera.U.x + temp.y * camera.U.y + temp.z * camera.U.z,
       temp.x * camera.V.x + temp.y * camera.V.y + temp.z * camera.V.z,
       temp.x * camera.N.x + temp.y * camera.N.y + temp.z * camera.N.z);
  } 
  convertPoint() {
    // calculando o ponto em 2d
    let tempX = ((camera.d / camera.hx) * (this.x / this.z));
    let tempY = ((camera.d / camera.hy) * (this.y / this.z));
    tempX = parseInt((tempX + 1) * (width / 2), 10);
    tempY = parseInt((1 - tempY) * (height / 2), 10);
    return new Point2d(tempX, tempY);
  }
}

class Point2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  sub(v) {
    return new Point2d(this.x - v.x, this.y - v.y);
  }

  crossProduct(v){
    return new Point(this.y * 1 - 1 * v.y, 1 * v.x - this.x * 1, this.x * v.y - this.y * v.x);
  }

  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

}

function getPoints2d() {
    for (var i = 0; i<points.length; i++) {
      points2d[i] = points[i].convertPoint();
    }
}

function drawLine (x1, y1, x2, y2, vectors) {
  if(x1<=x2){
    for(var i=x1; i<=x2;i++){
      var cor = phongIlumination(new Point2d(i,y1), vectors.v1, vectors.v2, vectors.v3);
      var red = parseInt(cor.x,10);
      var green = parseInt(cor.y,10);
      var blue = parseInt(cor.z,10);
      ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
      ctx.fillRect(i, y1, 1, 1);
    }
  }else{
    for(var i=x2; i<=x1;i++){
      var cor = phongIlumination(new Point2d(i,y1), vectors.v1, vectors.v2, vectors.v3);
      var red = parseInt(cor.x,10);
      var green = parseInt(cor.y,10);
      var blue = parseInt(cor.z,10);
      ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
      ctx.fillRect(i, y2, 1, 1);
    }
  }
}

function fillBottomFlatTriangle (v1, v2, v3) {
  var invslope1 = (v2.x - v1.x) / (v2.y - v1.y);
  var invslope2 = (v3.x - v1.x) / (v3.y - v1.y);

  var curx1 = v1.x;
  var curx2 = v1.x;

  for (var scanlineY = v1.y; scanlineY <= v2.y; scanlineY++) {
    drawLine(parseInt(curx1, 10), scanlineY, parseInt(curx2, 10), scanlineY, {v1, v2, v3});
    curx1 += invslope1;
    curx2 += invslope2;
  }
}

function fillTopFlatTriangle(v1, v2, v3) {
  var invslope1 = (v3.x - v1.x) / (v3.y - v1.y);
  var invslope2 = (v3.x - v2.x) / (v3.y - v2.y);

  var curx1 = v3.x;
  var curx2 = v3.x;

  for (var scanlineY = v3.y; scanlineY > v1.y; scanlineY--) {
    drawLine(parseInt(curx1, 10), scanlineY, parseInt(curx2, 10), scanlineY, {v1, v2, v3});
    curx1 -= invslope1;
    curx2 -= invslope2;
  }
}

function drawTriangle(v1, v2, v3){

  var t;
  if(v1.y > v2.y){
    t = v1;
    v1 = v2;
    v2 = t;
  }
  if(v1.y > v3.y){
    t = v1;
    v1 = v3;
    v3 = t;
  }
  if(v2.y > v3.y){
    t = v2;
    v2 = v3;
    v3 = t;
  }

  if (v2.y == v3.y) {
    fillBottomFlatTriangle(v1, v2, v3);
  } else if (v1.y == v2.y) {
    fillTopFlatTriangle(v1, v2, v3);
  } else {
    var v4 = new Point2d( 
    parseInt((v1.x + ((v2.y - v1.y) / (v3.y - v1.y)) * (v3.x - v1.x)), 10), v2.y);
    
    fillBottomFlatTriangle(v1, v2, v4);
    fillTopFlatTriangle(v2, v4, v3);
  }
}

class Triangle{
  constructor(p1, p2, p3){
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
}

async function setupCamera(){
    var reader = new FileReader();

    reader.onload = function(e) {
        var cameraData = reader.result.split('\n');
        var fileLine = cameraData[0].split(' ');
        let Pos = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        fileLine = cameraData[1].split(' ');
        let N = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        fileLine = cameraData[2].split(' ');
        let V = new Point(Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        // Ortogonizar vetor V
        V = V.sub(N.proj(V));
        fileLine = cameraData[3].split(' ');
        let d = Number(fileLine[0]);
        let hx = Number(fileLine[1]);
        let hy = Number(fileLine[2]);
        // Normalizar V e N para calcular U já normalizado
        V = V.normalize();
        N = N.normalize();
        let U = N.crossProduct(V);
        camera = new Camera(Pos, N, V, d, hx, hy, U);
    }
    var file = cameraInput.files[0];
    await reader.readAsText(file);
}

async function setupObject() {
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
    await reader.readAsText(file);
}

async function setupLight(){
    var reader = new FileReader();
    reader.onload = function(e){
        var lightData = reader.result.split('\n');
        var fileLine = lightData[0].split(' ');
        var lPos = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.Pos = lPos.adaptView();
        light.ka = Number(lightData[1]);
        fileLine = lightData[2].split(' ');
        light.ia = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.kd = Number(lightData[3]);
        fileLine = lightData[4].split(' ');
        light.od = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.ks = Number(lightData[5]);
        fileLine = lightData[6].split(' ');
        light.il = new Point (Number(fileLine[0]), Number(fileLine[1]), Number(fileLine[2]));
        light.n = Number(lightData[7]);
    }
    var file = lightInput.files[0];
    await reader.readAsText(file);
}

async function setupNormals(){
    for (var i = 0; i < points.length; i++) {
      pointNormals[i] = new Point(0, 0, 0);
    }
    for (var i = 0; i < triangles.length; i++) {
        var a = points[triangles[i].p1];
        var b = points[triangles[i].p2];
        var c = points[triangles[i].p3];

        var v1 = a.sub(b);
        var v2 = a.sub(c);

        var normal = v1.crossProduct(v2).normalize();
        if (normal.z < 0) {
          normal = normal.mult(-1);
        }

        pointNormals[triangles[i].p1] = pointNormals[triangles[i].p1].sum(normal);
        pointNormals[triangles[i].p2] = pointNormals[triangles[i].p2].sum(normal);
        pointNormals[triangles[i].p3] = pointNormals[triangles[i].p3].sum(normal);
    }
}

class Zbuffer{
  constructor(distance, r, g, b){
    this.distance = distance;

    //COR:
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

function setUpZbuffer(){
  for(let i = 0; i < width; i++){
    zb[i] = [];
    for (var j = 0; j < height; j++) {
      zb[i][j] = new Zbuffer(Infinity, 0, 0, 0);
    }
  }
}


function drawObject() {
  getPoints2d();
  for (var i = 0; i < triangles.length; i++) {
    triangleIndex = i;
    drawTriangle(points2d[triangles[i].p1], points2d[triangles[i].p2], points2d[triangles[i].p3]);
  }
}

function barCords(p, p1, p2, p3) {
  let totalArea = p2.sub(p1).crossProduct(p3.sub(p1)).norm() / 2;
  let areaAlpha = ((p2.sub(p)).crossProduct(p3.sub(p))).norm() / 2;
  let areaBeta = ((p1.sub(p)).crossProduct(p3.sub(p))).norm() / 2;
  let alpha = areaAlpha / totalArea;
  let beta = areaBeta / totalArea;
  let gama = 1 - alpha - beta;
  return {alpha, beta, gama};
}

function phongIlumination(p, p1, p2, p3) {
  // Pegar pontos 3d
  let v1 = points[triangles[triangleIndex].p1];
  let v2 = points[triangles[triangleIndex].p2];
  let v3 = points[triangles[triangleIndex].p3];
  // Calculando alpha, beta e gama
  let barCord = barCords(p, p1, p2, p3);
  // P = alpha * p1 + beta * p2 + gama + p3
  let P = ((v1.mult(barCord.alpha)).sum(v2.mult(barCord.beta))).sum(v3.mult(barCord.gama));
  let alphaNorma = pointNormals[triangles[triangleIndex].p1].mult(barCord.alpha);
  let betaNorma = pointNormals[triangles[triangleIndex].p2].mult(barCord.beta);
  let gamaNorma = pointNormals[triangles[triangleIndex].p3].mult(barCord.gama);
  // Calcular soma das normas multiplicadas pelas coordenadas baricêntricas
  let pNormal =  (alphaNorma.sum(betaNorma)).sum(gamaNorma);
  let V = P.mult(-1);
  let L = (light.Pos).sub(P);
  let R = ((pNormal.mult(pNormal.dotProduct(L))).mult(2)).sub(L);
  pNormal.normalize();
  V.normalize();
  L.normalize();
  R.normalize();
  
  //VERIFICAÇÃO DA NORMAL INVERTIDA:
  if(V.dotProduct(pNormal) < 0){
    pNormal = pNormal.mult(-1);
  }

  //CALCULO DAS ILUMINAÇÕES:

  // ILUMINAÇÃO AMBIENTE:

  let ambiental = light.ia.mult(light.ka);

  //ILUMINAÇÃO DIFUSA:

  let difusa = light.il.multVectors(light.od).mult(L.dotProduct(pNormal) * light.kd);
  
  //ILUMINAÇÃO ESPECULAR:
 
  let especular = light.il.mult(light.ks * Math.pow(R.dotProduct(V),light.n));
  

  if(pNormal.dotProduct(L) < 0){

    difusa = new Point(0,0,0);
    especular = new Point(0,0,0);

  }else if (R.dotProduct(V) < 0){

    especular = new Point(0,0,0);

  }

  let ilumination = ambiental.sum(difusa).sum(especular);

  ilumination.x = Math.min(ilumination.x, 255);
  ilumination.y = Math.min(ilumination.y, 255);
  ilumination.z = Math.min(ilumination.z, 255);

  return ilumination;
}
  
    

submitButton.addEventListener('click', async e => {
     setupCamera();
     setupObject();
     setupLight();
     setTimeout(function(){
      setupNormals();
      drawObject();
     }, 5000);
});

addButton.addEventListener('click', e => {
    var x = document.createElement("INPUT");
    x.setAttribute("type", "file");
    a.appendChild(x);
    objects++;
});
