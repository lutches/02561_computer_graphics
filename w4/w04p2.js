var gl;
var canvas;

var pointArray = [];
var colors = [];
var numSubdivisions = 2;

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

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
    gl.enable(gl.cullFace);
    gl.cullFace(gl.BACK);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initSphere(gl, numSubdivisions);


    var increase = document.getElementById("increase");
    increase.addEventListener('click', function () {
        if (numSubdivisions < 8) {
            numSubdivisions++;
        }
        initSphere(gl, numSubdivisions);
        render();
    });

    var decrease = document.getElementById("decrease");
    decrease.addEventListener('click', function () {
        if (numSubdivisions > 0) {
            numSubdivisions--;
        }
        initSphere(gl, numSubdivisions);
        render();
    });

    let eye = vec3(0.0, 0.0, -3);
    let up = vec3(0, 1, 0);
    let at = vec3(0, 0, 0);
    let V = lookAt(eye, at, up);
    let M = mat4();
    let mvplocation = gl.getUniformLocation(program, "modelViewMatrix");

    aspect = canvas.width / canvas.height;
    P = perspective(45, aspect, 0., 100);

    let MVP = mult(mult(P, V), M);
    gl.uniformMatrix4fv(mvplocation, false, flatten(MVP));

    function render() {
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        var aColor = gl.getAttribLocation(program, "aColor");
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, pointArray.length);
    }


    // Resize handler
    function resize() {
        canvas.width = window.innerWidth - 8;
        canvas.height = window.innerHeight - 40;
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = canvas.width / canvas.height;
        P = perspective(45, aspect, 0.1, 100);

        let MVP = mult(mult(P, V), M);
        gl.uniformMatrix4fv(mvplocation, false, flatten(MVP));

        render();
    }

    window.addEventListener('resize', resize);

    // Initial resize call to set up the viewport correctly
    resize();
}

function initSphere(gl, numSubdivisions) {
    pointArray = [];
    colors = [];
    tetrahedon(va, vb, vc, vd, numSubdivisions);
    gl.deleteBuffer(gl.vBuffer);
    gl.vBuffer = gl.createBuffer();
    gl.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointArray), gl.STATIC_DRAW);


    for (let point of pointArray) {
        const color = vec4(
            0.5 + 0.5 * point[0],
            0.5 + 0.5 * point[1],
            0.5 + 0.5 * point[2],
            1.0
        )
        colors.push(color);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
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
        pointArray.push(a, b, c);
    }
}




