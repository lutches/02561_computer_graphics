function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices;
var colors;

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    var radius = 0.25;
    var numSegments = 100;
    vertices = [];
    colors = [];

    for (var i = 0; i < numSegments; i++) {
        var theta = 2 * Math.PI * i / numSegments;
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta);
        vertices.push(vec2(x, y));
        colors.push(vec3(0.0, 1.0, 1.0));
    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.viewport(0, 0, canvas.width, canvas.height);

    var offsetLoc = gl.getUniformLocation(program, "offset");
    var offsetLoc = gl.getUniformLocation(program, "offset");
    var offset = 0;
    var v = 0;
    var g = -9.84 * 0.0001;

    function animate() {
        v = v + g;

        offset = offset + v;

        if (offset < -1.75) {
            offset = -1.75;
            v = -v;
        }

        gl.uniform1f(offsetLoc, offset);
        render(gl, vertices.length);

        requestAnimationFrame(animate);
    }

    animate();
}


function render(gl, numPoints) {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);
}
