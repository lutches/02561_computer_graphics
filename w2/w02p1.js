function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices;

window.onload = function init() {
    var canvas = document.getElementById("c");
    var clear = document.getElementById("clear");

    canvas.addEventListener("mousedown", function(ev) {
        var offset = canvas.getBoundingClientRect();
        mousepos = vec2(2*(ev.clientX-offset.left)/canvas.width-1,2*(canvas.height-ev.clientY+offset.top)/canvas.height-1);
        vertices.push(mousepos);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        render();
    });
    clear.addEventListener("click", function() {
        vertices = [];
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        render();
    });
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert( "WebGL isn't available");}

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    
    vertices = [];
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
    gl.drawArrays(gl.POINTS, 0, vertices.length);
}
