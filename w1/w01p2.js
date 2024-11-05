function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices;

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert( "WebGL isn't available");}

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    
    vertices = [vec2(1, 1), vec2(0.0, 0.0), vec2(1,0)];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position"); 
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.viewport(0, 0, canvas.width, canvas.height);

    render();
}


function render() {
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
}
