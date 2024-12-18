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

    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);
    gl.getExtension('OES_element_index_uint');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);




    const camera = new Object();
    camera.position = vec3(0, 0, 3);
    camera.view = lookAt(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0));
    camera.projection = perspective(60, 1, 0.1, 1e5);


    currentAngle = [0.0, 0.0];
    var q_rot = new Quaternion();
    var q_inc = new Quaternion();

    var z_eye = 300;
    eye = vec3(0, 0, z_eye);
    const at = vec3(0, 0, 0);

    var z = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);

    q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));

    let x_pan = 0; let y_pan = 0;

    initEventHandlers(canvas, q_inc, q_rot);




    canvas.addEventListener('wheel', (event) => {
        z_eye += event.deltaY * 0.03;
        z_eye = Math.max(70, z_eye);
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
                switch (mode) {
                    case 0: {
                        var u = vec3(x, y, project_to_sphere(x, y))
                        var v = vec3(lastX, lastY, project_to_sphere(lastX, lastY))

                        q_inc = q_inc.make_rot_vec2vec(normalize(u), normalize(v));

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
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_MVP'), false, flatten(MVP));

        
        render();
        requestAnimationFrame(animate);
    }
    gl.uniform4fv(gl.getUniformLocation(program, 'lightPos'), flatten(vec4(0.0, 0.0, -1.0, 0.0)));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraProjectionMatrix"), false, flatten(camera.projection));
    canvas.addEventListener('click', (ev) => {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            console.log('click');
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var picked = check(gl,  gl.getUniformLocation(program, 'u_Clicked'), x_in_canvas, y_in_canvas);
            if(picked) alert('The object is selected');
        }
    });

    function check(gl, u_clicked, x, y){
        var picked = false;
        gl.uniform1i(u_clicked, 1);
        render();
    
        var pixels = new Uint8Array(4);
        gl.readPixels(x,y,1,1,gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
        if (pixels[0]== 255) {picked = true;}
    
        gl.uniform1i(u_clicked, 0);
        return picked;
    }

    async function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if (object == null) {
                continue;
            }
            

            gl.bindBuffer(gl.ARRAY_BUFFER, object.vBuffer);
            gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Position'), 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Position'));


            gl.bindBuffer(gl.ARRAY_BUFFER, object.cBuffer);
            gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Color'), 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Color'));

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.iBuffer);

            // Draw the object
            gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_INT, 0);
        }
    }
    loadmodel(gl, '../assets/cube.obj', 30);
    animate();

}

async function loadmodel(gl, reference, scale) {
    // Load the object file and parse its vertices and normals
    const object = await readOBJFile(reference, scale, true);
    object.position = vec3(0, 0, 0);

    object.iBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, object.indices, gl.STATIC_DRAW);

    // Create, bind, and initialize the vertex buffer for positions
    object.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);

    // Configure the vertex position attribute
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Position'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Position'));


    object.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(object.colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Color'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Color'));


    objects.push(object);
    return;

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


