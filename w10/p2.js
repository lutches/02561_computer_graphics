var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var indices = [];
var colors = [];

var orbitRadius = 4;
let xAngle = 0;
let yAngle = 0;



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

    const aspect = canvas.width / canvas.height;
    const P = perspective(60, aspect, 0.1, 10); // FOV, aspect ratio, near, far
    const projectionLocation = gl.getUniformLocation(gl.program, "cameraProjectionMatrix");
    gl.uniformMatrix4fv(projectionLocation, false, flatten(P));

    currentAngle = [0.0, 0.0]; 
    var q_rot = new Quaternion();
    var q_inc = new Quaternion();

    var z_eye = 3;
    eye = vec3(0, 0, z_eye);
    const at = vec3(0, 0.5, 0);

    var z = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);

    q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));

    initEventHandlers(canvas, q_inc, q_rot);

    function initEventHandlers(canvas, q_inc, q_rot) {
        var dragging = false;              // Dragging or not  
        var lastX = -1, lastY = -1;

        canvas.onmousedown = function (ev) {   // Mouse is pressed
            var rect = ev.target.getBoundingClientRect();
            x = 2 * (ev.clientX - rect.left) / canvas.width - 1;
            y = 2 * (canvas.height - (ev.clientY - rect.top)) / canvas.height - 1;

            if (-1.0 <= x && x < 1.0 && -1.0 <= y && y < 1.0) {
                lastX = x;
                lastY = y;
                dragging = true;
            }
        };

        canvas.onmouseup = function (ev) {
            dragging = false;
        };

        canvas.onmousemove = function (ev) {
            var rect = ev.target.getBoundingClientRect();

            x = 2 * (ev.clientX - rect.left) / canvas.width - 1;
            y = 2 * (canvas.height - ev.clientY + rect.top - 1) / canvas.height - 1;
            if (dragging) {

                var u = vec3(x, y, project_to_sphere(x, y))

                var v = vec3(lastX, lastY, project_to_sphere(lastX, lastY))


                q_inc = q_inc.make_rot_vec2vec(normalize(u), normalize(v));

                q_rot = q_rot.multiply(q_inc);
            }
            lastX = x, lastY = y;
        }
    }


    function animate() {

        Rx = rotateX(-currentAngle[0]);
        Ry = rotateY(-currentAngle[1]);


        let view = lookAt(q_rot.apply(eye), at, q_rot.apply(vec3(0, 1, 0)));
        model = mat4();
        const modelLocation = gl.getUniformLocation(gl.program, 'model');
        gl.uniformMatrix4fv(modelLocation, false, flatten(model));
        const viewLocation = gl.getUniformLocation(gl.program, 'view');
        gl.uniformMatrix4fv(viewLocation, false, flatten(view));
        render();
        requestAnimationFrame(animate);
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Calculate aspect ratio and set the projection matrix






        gl.getExtension('OES_element_index_uint');
        // Draw the object
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    }

    animate();
}

async function loadmodel(gl, scale) {
    // Load the object file and parse its vertices and normals
    const object = await readOBJFile('../assets/rat.obj', scale, true);
    pointArray = object.vertices; // Vertex positions
    normalsArray = object.normals; // Vertex normals
    indices = object.indices; // Indices for drawing triangles


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

}

function project_to_sphere(x, y) {
    var r = 2;
    var d = Math.sqrt(x * x + y * y);
    var t = r * Math.sqrt(2);
    var z;
    if (d < r) // Inside sphere
      z = Math.sqrt(r * r - d * d);
    else if (d < t)
      z = 0;
    else       // On hyperbola
      z = t * t / d;
    return z;
  }
  