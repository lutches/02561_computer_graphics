var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var indices = [];
var colors = [];
var objects = [];

var orbitRadius = 4;
let xAngle = 0;
let yAngle = 0;

var center = vec3(0, 0, 0);

mode = 0;
var selected = null;


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
    const u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
    gl.uniform1i(u_PickedFace, -1);

    gl.getExtension('OES_element_index_uint');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }


    const camera = new Object();
    camera.position = vec3(0, 0, 3);
    camera.view = lookAt(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0));
    camera.projection = perspective(60, 1, 0.1, 1e5);


    currentAngle = [0.0, 0.0];
    var q_rot = new Quaternion();
    var q_inc = new Quaternion();

    var z_eye = 5;
    eye = vec3(0, 0, z_eye);
    const at = vec3(0, 0, 0);
    const up = vec3(0, 1, 0);

    var z = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);

    q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));

    let x_pan = 0; let y_pan = 0;

    initEventHandlers(canvas, q_inc, q_rot);


    canvas.addEventListener('wheel', (event) => {
        z_eye += event.deltaY * 0.03;
        z_eye = Math.max(3, z_eye);
        event.preventDefault();
    }, { passive: false });

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

                var u = vec3(x, y, project_to_sphere(x, y))
                var v = vec3(lastX, lastY, project_to_sphere(lastX, lastY))

                q_inc = q_inc.make_rot_vec2vec(normalize(u), normalize(v));


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


    function animate() {
        // Set initial camera position
        camera.position = vec3(0, 0, z_eye);  // Corrected from z_eye * z_eye

        // Apply rotation to right and up directions
        let q_right = q_rot.apply(vec3(1.0, 0.0, 0.0));  // Right direction after rotation
        let q_up = q_rot.apply(up);  // Up direction after rotation

        // Compute offsets for panning (x_pan and y_pan)
        let x_offset = vec3(x_pan * q_right[0], x_pan * q_right[1], x_pan * q_right[2]);
        let y_offset = vec3(y_pan * q_up[0], y_pan * q_up[1], y_pan * q_up[2]);

        // Update center based on pan offsets
        center = subtract(at, add(x_offset, y_offset));


        q_rot = q_rot.multiply(q_inc);


        camera.position = add(q_rot.apply(vec3(0, 0, z_eye)), center);


        camera.view = lookAt(camera.position, center, q_up);
        let MVP = mult(camera.projection, camera.view);
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'u_MVP'), false, flatten(MVP));


        render();
        requestAnimationFrame(animate);
    }



    canvas.addEventListener('click', (ev) => {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var face = checkFace(gl, x_in_canvas, y_in_canvas);
            gl.uniform1i(u_PickedFace, face);
        }
    });

    function checkFace(gl, x, y) {
        var pixels = new Uint8Array(4);

        gl.uniform1i(u_PickedFace, 0);
        render();

        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        return pixels[3];
    }

    async function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // Draw the object
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    }

    animate();

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


function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    var vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0     // v4-v7-v6-v5 back
    ]);

    var colors = new Float32Array([     // Colors
        0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0,  // v0-v1-v2-v3 front
        1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5,  // v0-v3-v4-v5 right
        0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5,  // v0-v5-v6-v1 up
        0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5,  // v1-v6-v7-v2 left
        0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, 0.5,  // v7-v4-v3-v2 down
        0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0,   // v4-v7-v6-v5 back
    ]);

    var faces = new Uint8Array([
        1, 1, 1, 1,
        2, 2, 2, 2,
        3, 3, 3, 3,
        4, 4, 4, 4,
        5, 5, 5, 5,
        6, 6, 6, 6,
    ])

    var indices = new Uint8Array([       // Indices of the vertices
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    // Create a buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer)
        return -1;

    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
        return -1;

    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
        return -1;

    if (!initArrayBuffer(gl, faces, 1, gl.UNSIGNED_BYTE, 'a_Face'))
        return -1;

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}