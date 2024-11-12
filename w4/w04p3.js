var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var colors = [];
var numSubdivisions = 3;


var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var orbiting = true;
var orbitRadius = 4;
let orbitAngle = 0;



window.onload = function init() {
    canvas = document.getElementById("c");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        const error = "WebGL isn't available";
        alert("WebGL isn't available");
        throw new Error(error);
    }

    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    /////////////////////////////////////////////////////////////////////
    // region buffers

    // vertex position
    gl.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);

    const vPosition = gl.getAttribLocation(gl.program, "vertex_position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    

    gl.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexNormalBuffer);
  
    gl.vertexNormalLoc = gl.getAttribLocation(gl.program, "vertex_normal");
    gl.vertexAttribPointer(gl.vertexNormalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.vertexNormalLoc);


    

    //////////////////////////////////////////////////////////////////////
    // region camera

    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 0.3;
    var far = 100;

    var perspectiveCamera = perspective(fov, aspect, near, far);

    var cameraProjectionMatrixLocation = gl.getUniformLocation(gl.program, "cameraProjectionMatrix");
    gl.uniformMatrix4fv(cameraProjectionMatrixLocation, false, flatten(perspectiveCamera));

    var lightDirection = vec4(0.0, 0.0, -1.0, 0.0);
    var lightPosLocation = gl.getUniformLocation(gl.program, 'lightPos');
    gl.uniform4fv(lightPosLocation, flatten(lightDirection));
  
    var kd = vec4(0.5, 0.5, 0.5, 1.0); // RED
    var kdLocation = gl.getUniformLocation(gl.program, "kd");
    gl.uniform4fv(kdLocation, flatten(kd));

    //////////////////////////////////////////////////////////////////////
    // Buttons

    var rotate = document.getElementById("rotate");
    rotate.addEventListener('click', function () { orbiting = !orbiting; });

    var increase = document.getElementById("increase");
    increase.addEventListener('click', function () {
        if (numSubdivisions < 8) {
            numSubdivisions++;
        }
        initSphere(gl, numSubdivisions);

    });

    var decrease = document.getElementById("decrease");
    decrease.addEventListener('click', function () {
        if (numSubdivisions > 0) {
            numSubdivisions--;
        }
        initSphere(gl, numSubdivisions);
    });

    //////////////////////////////////////////////////////////////////////

    initSphere(gl, numSubdivisions);
    render();
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    if (orbiting) {
        orbitAngle += 0.01;
    }
    var at = vec3(0, 0, 0);
    var eye = vec3(orbitRadius * Math.sin(orbitAngle), 0.0, orbitRadius * Math.cos(orbitAngle));
    var up = vec3(0, 1, 0);

    var modelviewmatrix = lookAt(eye, at, up);

    var modelviewLocation = gl.getUniformLocation(gl.program, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelviewLocation, false, flatten(modelviewmatrix));

    gl.drawArrays(gl.TRIANGLES, 0, pointArray.length);

    requestAnimationFrame(render); // Store the animation frame ID    
}


function initSphere(gl, numSubdivisions) {
    pointArray = [];
    normalsArray = [];

    tetrahedon(va, vb, vc, vd, numSubdivisions);


    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointArray), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);



    // Update vertex attribute pointers

    
}

function tetrahedon(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle( a, b, c );
    }
}

function triangle(a, b, c){
    pointArray.push(a);
    pointArray.push(b);
    pointArray.push(c);
  
    normalsArray.push(a);
    normalsArray.push(b);
    normalsArray.push(c);
  }




