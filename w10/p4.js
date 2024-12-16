var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var indices = [];
var colors = [];

var orbitRadius = 4;
let xAngle = 0;
let yAngle = 0;

mode = 0;



window.onload = function init() {
    canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        const error = "WebGL isn't available";
        alert("WebGL isn't available");
        throw new Error(error);
    }
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.getExtension('OES_element_index_uint');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    loadmodel(gl, 0.02);

    const rotate = document.getElementById("rotate");
    rotate.addEventListener('click', function () { mode = 0; });

    const dolly = document.getElementById("dolly");
    dolly.addEventListener('click', function () { mode = 1; });

    const pan = document.getElementById("pan");
    pan.addEventListener('click', function () { mode = 2; });



    currentAngle = [0.0, 0.0];
    var q_rot = new Quaternion();
    var q_inc = new Quaternion();

    var z_eye = 3;
    eye = vec3(0, 0, z_eye);
    const at = vec3(0, 0.5, 0);

    var z = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);

    q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));

    let x_pan = 0; let y_pan = 0;

    initEventHandlers(canvas, q_inc, q_rot);

    function initEventHandlers(canvas, q_inc, q_rot) {
        var dragging = false;              // Dragging or not  
        var lastX = -1, lastY = -1;
        var lastMouseMoveTime = 0;
        let spinning = false;

        canvas.onmousedown = function (ev) {   // Mouse is pressed
            spinning = true;
            lastMouseMoveTime = Date.now();
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
            if ((x == lastX && y == lastY) || lastMouseMoveTime < 20) {
                q_inc.setIdentity(); 
              }
            spinning = false;
        };

        canvas.onmousemove = function (ev) {
            var rect = ev.target.getBoundingClientRect();

            x = 2 * (ev.clientX - rect.left) / canvas.width - 1;
            y = 2 * (canvas.height - ev.clientY + rect.top - 1) / canvas.height - 1;
            if (dragging) {
                switch (mode) {
                    case 0: {
                        var u = vec3(x, y, project_to_sphere(x, y))
                        var v = vec3(lastX, lastY, project_to_sphere(lastX, lastY))

                        q_inc = q_inc.make_rot_vec2vec(normalize(u), normalize(v));

                    } break;

                    case 1: {
                        z_eye += (y - lastY) * z_eye;
                        z_eye = Math.max(0.1, z_eye);
                    } break;

                    case 2: {
                        x_pan += (x - lastX) * z_eye;
                        y_pan += (y - lastY) * z_eye;
                    } break;

                }
            }
            lastX = x, lastY = y;
            setInterval(() => {
                if (spinning && Date.now() - lastMouseMoveTime > 20) {
                    q_inc.setIdentity(); // Reset quaternion
                    spinning = false; // Stop spinning
                }
            }, 10);
        }
    }
    const up = vec3(0, 1, 0);
    function animate() {
        eye = vec3(0, 0, z_eye);

        let q_right = q_rot.apply(vec3(1.0, 0.0, 0.0)); 
        let q_up = q_rot.apply(up);
        
        let x_offset = vec3(x_pan * q_right[0], x_pan * q_right[1], x_pan * q_right[2]); 
        let y_offset = vec3(y_pan * q_up[0], y_pan * q_up[1], y_pan * q_up[2]);

        let center = vec3(
            at[0] - (x_offset[0] + y_offset[0]), 
            at[1] - (x_offset[1] + y_offset[1]), 
            at[2] - (x_offset[2] + y_offset[2])  
        );


        eye = add(q_rot.apply(vec3(0, 0, z_eye)), center); 
        const view = lookAt(eye, center, q_rot.apply(up));


        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, flatten(view));
        render();
        requestAnimationFrame(animate);
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        q_rot = q_rot.multiply(q_inc);

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


    let indexbuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexbuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Create, bind, and initialize the vertex buffer for positions
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointArray, gl.STATIC_DRAW);

    // Configure the vertex position attribute
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Position'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Position'));

    // Create, bind, and initialize the vertex buffer for normals
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalsArray, gl.STATIC_DRAW);

    // Configure the vertex normal attribute
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Normal'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Normal'));

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(object.colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Color'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Color'));

    gl.uniform4fv(gl.getUniformLocation(program, 'lightPos'), flatten(vec4(0.0, 0.0, -1.0, 0.0)));

    const P = perspective(60, 1, 0.1, 50); // FOV, aspect ratio, near, far
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraProjectionMatrix"), false, flatten(P));

}

// yoinked from 02560/lectures/week02/trackball.js 
function project_to_sphere(x, y) {
    var r = 1;
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
