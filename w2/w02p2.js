function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices = [];
var colorvertecies = [];
var selectedColor = [0.23, 0.7, 0.93, 1];
var drawingcolor = [0, 0, 0, 1];

// Declare canvas and other HTML elements as global variables
var canvas;
var colorPicker;
var drawingColor;
var clear;

window.onload = function init() {
    // Initialize HTML elements
    canvas = document.getElementById("c");
    colorPicker = document.getElementById("color");
    drawingColor = document.getElementById("dcolor");
    clear = document.getElementById("clear");

    canvas.addEventListener("mousedown", function (ev) {
        var offset = canvas.getBoundingClientRect();
        var mousepos = vec2(
            2 * (ev.clientX - offset.left) / canvas.width - 1,
            2 * (canvas.height - ev.clientY + offset.top) / canvas.height - 1
        );

        vertices.push(mousepos);
        colorvertecies.push(drawingcolor);

        updateBuffers(); // This function can now access the canvas
        render(selectedColor);
    });

    clear.addEventListener("click", function () {
        vertices = [];
        colorvertecies = [];
        updateBuffers();

        render(selectedColor);
    });

    colorPicker.addEventListener("input", function (ev) {
        var hexColor = ev.target.value;
        selectedColor = hexToRgbA(hexColor);
        render(selectedColor);
    });

    drawingColor.addEventListener("input", function (ev) {
        var hexColor = ev.target.value;
        drawingcolor = hexToRgbA(hexColor);
    });

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create buffer for vertices
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create buffer for color vertices
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorvertecies), gl.STATIC_DRAW);

    var cPosition = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition);

    // Save buffers to global scope for later use
    canvas.vBuffer = vBuffer;
    canvas.cBuffer = cBuffer;

    gl.viewport(0, 0, canvas.width, canvas.height);
    render(selectedColor);
};

function updateBuffers() {
    // Update the vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Update the color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorvertecies), gl.STATIC_DRAW);
}

function render(color) {
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Bind the vertex buffer and set up the vertex attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.vBuffer);
    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Bind the color buffer and set up the color attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.cBuffer);
    var cPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "a_Color");
    gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition);

    gl.drawArrays(gl.POINTS, 0, vertices.length);
}

function hexToRgbA(hex) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return [
            ((c >> 16) & 255) / 255,
            ((c >> 8) & 255) / 255,
            (c & 255) / 255,
            1.0
        ];
    }
    throw new Error('Bad Hex');
}
