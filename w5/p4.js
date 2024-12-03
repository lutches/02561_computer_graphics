var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var indices = [];
var colors = [];

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

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    // Perspective is made in the render function to handle resizing of the window

    var scale = 0.02;

    loadmodel(gl, scale);

    var lightDirection = vec4(0.0, 0.0, -1.0, 0.0);
    var lightPosLocation = gl.getUniformLocation(gl.program, 'lightPos');
    gl.uniform4fv(lightPosLocation, flatten(lightDirection));

    var kd = vec4(0.5, 0.5, 0.5, 1.0); // Grey
    var kdLocation = gl.getUniformLocation(gl.program, "kd");
    gl.uniform4fv(kdLocation, flatten(kd));

    //////////////////////////////////////////////////////////////////////
    // Buttons

    var rotate = document.getElementById("rotate");
    rotate.addEventListener('click', function () { orbiting = !orbiting; });

    //////////////////////////////////////////////////////////////////////


    //initSphere(gl, numSubdivisions);


    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Adjust the canvas size and viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 80;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratio and set the projection matrix
        const aspect = canvas.width / canvas.height;
        const P = perspective(60, aspect, 0.1, 10); // FOV, aspect ratio, near, far
        const projectionLocation = gl.getUniformLocation(gl.program, "cameraProjectionMatrix");
        gl.uniformMatrix4fv(projectionLocation, false, flatten(P));

        // Clear the canvas and depth buffer

        // Handle orbiting camera movement
        if (orbiting) {
            orbitAngle += 0.02;
        }
        const at = vec3(0, 0.5, 0);
        const eye = vec3(
            orbitRadius * Math.sin(orbitAngle),
            0.0,
            orbitRadius * Math.cos(orbitAngle)
        );
        const up = vec3(0, 1, 0);

        // Calculate and set the model-view matrix
        const modelViewMatrix = lookAt(eye, at, up);
        const modelViewLocation = gl.getUniformLocation(gl.program, 'modelViewMatrix');
        gl.uniformMatrix4fv(modelViewLocation, false, flatten(modelViewMatrix));

        gl.getExtension('OES_element_index_uint');
        // Draw the object
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

        // Request the next frame
        requestAnimationFrame(render);
    }

    render();
}

async function loadmodel(gl, scale) {
    // Load the object file and parse its vertices and normals
    const object = await readOBJFile('../assets/rat.obj', scale, true);
    pointArray = object.vertices; // Vertex positions
    normalsArray = object.normals; // Vertex normals
    indices = object.indices; // Indices for drawing triangles

    console.log(pointArray);
    console.log(normalsArray);
    console.log(indices);

    // Get attribute locations from the shader program
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    const a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

    let indexbuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexbuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Create, bind, and initialize the vertex buffer for positions
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointArray, gl.STATIC_DRAW);

    // Configure the vertex position attribute
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Create, bind, and initialize the vertex buffer for normals
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalsArray, gl.STATIC_DRAW);

    // Configure the vertex normal attribute
    gl.vertexAttribPointer(a_Normal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Unbind the buffer for safety
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    console.log('Model loaded successfully.');
}