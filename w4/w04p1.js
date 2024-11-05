window.onload = function init() {
    var canvas = document.getElementById("c");
    var increase = document.getElementById("increase");
    var decrease = document.getElementById("decrease");
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.vBuffer = null;

    var numSubdivisions = 2;
    var numVertices = initSphere(gl, numSubdivisions);


    increase.addEventListener('click', function () {
        if (numSubdivisions < 8) {
            numSubdivisions++;
        }
        numVertices = initSphere(gl, numSubdivisions);
        render();
    });

    decrease.addEventListener('click', function () {
        if (numSubdivisions > 0) {
            numSubdivisions--;
        }
        numVertices = initSphere(gl, numSubdivisions);
        render();
    });


    let mvplocation = gl.getUniformLocation(program, "MVP");

    let eye = vec3(0.0, 0.0, -3.5);
    let up = vec3(0, 1, 0);
    let at = vec3(0, 0, 0.5);
    let V = lookAt(eye, at, up);
    let M = mat4();

    aspect = canvas.width / canvas.height;
    P = perspective(45, aspect, 0.1, 100);

    let MVP = mult(mult(P, V), M);
    gl.uniformMatrix4fv(mvplocation, false, flatten(MVP));

    function render() {
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }


    // Resize handler
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight- 40;
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
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);
    var pointArray = [];
    tetrahedon(pointArray, va, vb, vc, vd, numSubdivisions);
    gl.deleteBuffer(gl.vBuffer);
    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointArray), gl.STATIC_DRAW);
    return pointArray.length;
}

function tetrahedon(pointArray, a, b, c, d, n) {
    divideTriangle(pointArray, a, b, c, n);
    divideTriangle(pointArray, d, c, b, n);
    divideTriangle(pointArray, a, d, b, n);
    divideTriangle(pointArray, a, c, d, n);
}

function divideTriangle(pointArray, a, b, c, count) {
    if (count > 0) {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
        divideTriangle(pointArray, a, ab, ac, count - 1);
        divideTriangle(pointArray, ab, b, bc, count - 1);
        divideTriangle(pointArray, bc, c, ac, count - 1);
        divideTriangle(pointArray, ab, bc, ac, count - 1);
    } else {
        pointArray.push(a, b, c);
    }
}




