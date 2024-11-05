function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var vertices = {
    triangleColor: [],
    tpoints: [],
};

var selectedColor = [0.23, 0.7, 0.93, 1];
var drawingcolor = [0, 0, 0, 1];

// Declare canvas and other HTML elements as global variables
var canvas;
var colorPicker;
var drawingColor;
var clear;
var mode;
var centercolor

window.onload = function init() {
    // Initialize HTML elements
    canvas = document.getElementById("c");
    colorPicker = document.getElementById("color");
    drawingColor = document.getElementById("dcolor");
    clear = document.getElementById("clear");
    dots = document.getElementById("dots");
    triangle = document.getElementById("triangle");
    circle = document.getElementById("circle");

    canvas.addEventListener("mousedown", function (ev) {
        var offset = canvas.getBoundingClientRect();
        var mousepos = vec2(
            2 * (ev.clientX - offset.left) / canvas.width - 1,
            2 * (canvas.height - ev.clientY + offset.top) / canvas.height - 1
        );

        if (mode == "triangle") {
            vertices.tpoints.push(mousepos);
            vertices.triangleColor.push(drawingcolor);
        }
        else if (mode == "circle") {
            if (vertices.tpoints.length % 3 == 0) {
                vertices.tpoints.push(mousepos);
                vertices.triangleColor.push(drawingcolor);
            }
            else {
                center = vertices.tpoints[vertices.tpoints.length - 1];
                ccolor = vertices.triangleColor[vertices.triangleColor.length - 1];
                vertices.tpoints.pop();
                vertices.triangleColor.pop();
                var radius = Math.sqrt(Math.pow(center[0] - mousepos[0], 2) + Math.pow(center[1] - mousepos[1], 2));
                drawCircle(center, radius, ccolor, drawingcolor);
            }
        }
        else {
            drawCircle(mousepos, 0.02, drawingcolor, drawingcolor);
        }

        render();
    });


    triangle.addEventListener("click", function () {
        mode = "triangle";
        removeExtra();
        render();
    });
    dots.addEventListener("click", function () {
        mode = "dots";
        removeExtra();
        render();
    });
    circle.addEventListener("click", function () {
        mode = "circle";
        removeExtra();
        render();
    })

    clear.addEventListener("click", function () {

        vertices.tpoints = [];
        vertices.triangleColor = [];


        render();
    });

    colorPicker.addEventListener("input", function (ev) {
        var hexColor = ev.target.value;
        selectedColor = hexToRgbA(hexColor);
        render();
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

    {
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
        gl.bufferData(gl.ARRAY_BUFFER, [], gl.STATIC_DRAW);

        var cPosition = gl.getAttribLocation(program, "a_Color");
        gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cPosition);

        // Save buffers to global scope for later use
        canvas.vBuffer = vBuffer;
        canvas.cBuffer = cBuffer;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    render();
};
function removeExtra() {
    while (vertices.tpoints.length % 3 != 0) {
        vertices.tpoints.pop();
        vertices.triangleColor.pop();
    }
}
function drawCircle(center, radius, ccolor, bcolor) {
    numSegments = 50;

    for (var i = 0; i < numSegments; i++) {
        var theta1 = 2 * Math.PI * i / numSegments;
        var theta2 = 2 * Math.PI * (i + 1) / numSegments;

        // First vertex of the triangle (the center)
        vertices.tpoints.push(center);
        vertices.triangleColor.push(ccolor);

        // Second vertex on the circumference
        var x1 = center[0] + radius * Math.cos(theta1);
        var y1 = center[1] + radius * Math.sin(theta1);
        vertices.tpoints.push(vec2(x1, y1));
        vertices.triangleColor.push(bcolor);

        // Third vertex on the circumference
        var x2 = center[0] + radius * Math.cos(theta2);
        var y2 = center[1] + radius * Math.sin(theta2);
        vertices.tpoints.push(vec2(x2, y2));
        vertices.triangleColor.push(bcolor);
    }
}

function drawTriangles() {
    // Bind the vertex buffer and set up the vertex attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices.tpoints), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Bind the color buffer and set up the color attribute pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, canvas.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices.triangleColor), gl.STATIC_DRAW);
    var cPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "a_Color");
    gl.vertexAttribPointer(cPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cPosition);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.tpoints.length);
    gl.drawArrays(gl.POINTS, vertices.tpoints.length - vertices.tpoints.length % 3, vertices.tpoints.length % 3, gl.STATIC_DRAW);
}

function render() {
    gl.clearColor(selectedColor[0], selectedColor[1], selectedColor[2], selectedColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawTriangles();
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
