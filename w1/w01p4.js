function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices;

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vertices = [vec2(-0.5, 0.5), vec2(0.5, 0.5), vec2(0.5,-0.5), vec2(-0.5, -0.5)];
    var colors = [vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), vec3(1,1,0)];

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

    var betaLoc = gl.getUniformLocation(program, "beta");
    var beta = 0.0;
    function animate() {
        beta += 0.01;
        gl.uniform1f(betaLoc, beta);
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
