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

    var z_eye = 500;
    eye = vec3(0, 0, z_eye);
    const at = vec3(0, 0, 0);

    var z = vec3(eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]);

    q_rot = q_rot.make_rot_vec2vec(vec3(0, 0, 1), normalize(z));

    let x_pan = 0; let y_pan = 0;

    initEventHandlers(canvas, q_inc, q_rot);

    const rotate = document.getElementById("rotate");
    rotate.addEventListener('click', function () { mode = 0; });

    const pan = document.getElementById("pan");
    pan.addEventListener('click', function () { mode = 2; });

    const rat = document.getElementById("rat");
    rat.addEventListener('click', function () { loadmodel(gl, '../assets/rat.obj', 1); });

    const teapot = document.getElementById("teapot");
    teapot.addEventListener('click', function () { loadmodel(gl, '../assets/teapot.obj', 15); });

    canvas.addEventListener('click', (event) => {
        selectedObject = selectObject(event, canvas, camera, objects)
        selected = selectedObject

    });

    canvas.addEventListener('wheel', (event) => {
        z_eye += event.deltaY * 0.01;
        z_eye = Math.max(1, z_eye);
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
        // Set initial camera position
        camera.position = vec3(0, 0, z_eye);  // Corrected from z_eye * z_eye

        // Apply rotation to right and up directions
        let q_right = q_rot.apply(vec3(1.0, 0.0, 0.0));  // Right direction after rotation
        let q_up = q_rot.apply(up);  // Up direction after rotation

        // Compute offsets for panning (x_pan and y_pan)
        let x_offset = multiplyScalar(q_right, x_pan);
        let y_offset = multiplyScalar(q_up, y_pan);

        // Update center based on pan offsets
        center = subtract(at, add(x_offset, y_offset));

        // Update rotation quaternion by incrementing it
        q_rot = q_rot.multiply(q_inc);

        // Recalculate the camera position based on rotation and center
        camera.position = add(q_rot.apply(vec3(0, 0, z_eye)), center);

        // Compute the view matrix using the updated position, center, and up direction
        camera.view = lookAt(camera.position, center, q_up);



        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, flatten(camera.view));
        render();
        requestAnimationFrame(animate);
    }
    gl.uniform4fv(gl.getUniformLocation(program, 'lightPos'), flatten(vec4(0.0, 0.0, -1.0, 0.0)));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraProjectionMatrix"), false, flatten(camera.projection));

    async function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if (object == null) {
                continue;
            }
            await Promise.resolve(object);
            if (i == selected) {
                gl.uniform4fv(gl.getUniformLocation(program, 'alternativeColor'), flatten(vec4(1.0, 0.0, 0.0, 1.0)));
            }
            else {
                gl.uniform4fv(gl.getUniformLocation(program, 'alternativeColor'), flatten(vec4(0.0, 0.0, 0.0, 0.0)));
            }


            gl.bindBuffer(gl.ARRAY_BUFFER, object.vBuffer);
            gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Position'), 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Position'));

            gl.bindBuffer(gl.ARRAY_BUFFER, object.nBuffer);
            gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Normal'), 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Normal'));

            gl.bindBuffer(gl.ARRAY_BUFFER, object.cBuffer);
            gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Color'), 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Color'));

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.iBuffer);

            // Draw the object
            gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_INT, 0);
        }
    }

    animate();

}

async function loadmodel(gl, reference, scale) {
    // Load the object file and parse its vertices and normals
    const object = await readOBJFile(reference, scale, true);
    console.log(object.indices);
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

    // Create, bind, and initialize the vertex buffer for normals
    object.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, object.normals, gl.STATIC_DRAW);

    // Configure the vertex normal attribute
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'a_Normal'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'a_Normal'));

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

function selectObject(event, canvas, camera, objects) {
    const rect = canvas.getBoundingClientRect();
    let mouseX = (event.clientX - rect.left) / rect.width * 2 - 1;
    let mouseY = (1 - (event.clientY - rect.top) / rect.height) * 2 - 1;


    const mouseNDC = vec4(mouseX, mouseY, -1, 1.0);
    const viewProjectionMatrix = mult(camera.projection, camera.view);
    const inverseViewProj = inverse4(viewProjectionMatrix);

    let rayStartWorld = mult(inverseViewProj, mouseNDC);
    rayStartWorld = scale(1 / rayStartWorld[3], rayStartWorld);

    const ray = {
        origin: camera.position,
        direction: normalize(subtract(vec3(rayStartWorld), camera.position)),
        max: Infinity
    };
    let nearestObject = null;
    let index = 0;
    console.log(ray.direction, ray.origin);
    for (let object of objects) {
        const intersection = intersectRayWithObject(ray, object);
        if (intersection && intersection.distance < ray.max) {
            nearestObject = object;
            nearestObject.index = index;
            ray.max = intersection.distance;
        }
        index++;
    }

    return nearestObject ? nearestObject.index : null;
}


function intersectRayWithObject(ray, object) {
    let nearestIntersection = null;


    for (let i = 0; i < object.indices.length; i += 3) {

        const i0 = object.indices[i] * 3;    
        const i1 = object.indices[i + 1] * 3;
        const i2 = object.indices[i + 2] * 3;


        const v0 = vec3(object.vertices[i0], object.vertices[i0 + 1], object.vertices[i0 + 2]);
        const v1 = vec3(object.vertices[i1], object.vertices[i1 + 1], object.vertices[i1 + 2]);
        const v2 = vec3(object.vertices[i2], object.vertices[i2 + 1], object.vertices[i2 + 2]);


        const intersection = rayTriangleIntersect(ray, v0, v1, v2);

        if (intersection && (!nearestIntersection || intersection.distance < nearestIntersection.distance)) {
            nearestIntersection = intersection;
        }
    }

    return nearestIntersection;
}


function rayTriangleIntersect(ray, v0, v1, v2) {
    const EPSILON = 0.000001; 
    const edge1 = subtract(v1, v0);
    const edge2 = subtract(v2, v0);
    const h = cross(ray.direction, edge2);
    const a = dot(edge1, h);

    if (a > -EPSILON && a < EPSILON) {
        return null; 
    }

    const f = 1.0 / a;
    const s = subtract(ray.origin, v0);
    const u = f * dot(s, h);

    if (u < 0.0 || u > 1.0) {
        return null;
    }

    const q = cross(s, edge1);
    const v = f * dot(ray.direction, q);

    if (v < 0.0 || u + v > 1.0) {
        return null;
    }

    const t = f * dot(edge2, q);

    if (t > EPSILON) {
        const intersectionPoint = add(ray.origin, multiplyScalar(ray.direction, t));  
        return { distance: t, point: intersectionPoint };
    } else {
        return null; 
    }
}



function multiplyScalar(v, scalar) {
    return vec3(v[0] * scalar, v[1] * scalar, v[2] * scalar);
}

