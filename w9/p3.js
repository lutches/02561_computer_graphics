let program_object, program_ground, program_shadow;
let gl;
let fbo;


let eye = vec3(0, 0, 0);
let up = vec3(0, 1, 0);
let at = vec3(0, 0, -1);
let view = lookAt(eye, at, up);
let yCoord = -0.999;
let objectModel = translate(vec3(0.0, yCoord, -3.0))
var projection;
let lightView;

let at_l, v_l, p_l;
let eye_l;

var object;

var indices = [
    // First quad
    0, 1, 2,
    0, 2, 3
];
// Define vertices and texture coordinates
var vertices = [
    // Ground quad
    vec4(-2, -1, -1, 1),
    vec4(2, -1, -1, 1),
    vec4(2, -1, -5, 1),
    vec4(-2, -1, -5, 1),

];

var texCoords = [
    // Ground quad
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1),

];

var rotate = true;
var follow = false;
var radius = 3.5;
var alpha = 0.0;
var lightCenter = vec3(0.0, 3.5, -3.0);
var lightPos = vec3(radius * Math.sin(alpha), 0, radius * Math.cos(alpha));


window.onload = async function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = WebGLUtils.setupWebGL(canvas); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); // cornflower blue
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.getExtension('OES_element_index_uint');

    fbo = initFramebufferObject(gl, 512.0, 512.0);

    // Rotate button
    document.getElementById('rotate-switch').addEventListener('change', function () { rotate = this.checked; });
    document.getElementById('follow-switch').addEventListener('change', function () { follow = this.checked; });




    program_object = initShaders(gl, "vertex-shader-obj", "fragment-shader-obj");
    program_ground = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    program_shadow = initShaders(gl, "vertex-shader-shadows", "fragment-shader-shadows");

    // ground texture loading
    var image = new Image();
    image.src = "../assets/xamp23.png";;
    image.onload = function () {
        gl.useProgram(program_ground);
        program_ground.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, program_ground.texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.uniform1i(gl.getUniformLocation(program_ground, "texMap"), 0);
    };

    // Initiate object
    program_object.vPosition = gl.getAttribLocation(program_object, 'vPosition');
    program_object.vNormal = gl.getAttribLocation(program_object, 'vNormal');
    program_object.vColor = gl.getAttribLocation(program_object, 'vColor');

    program_object.vLoc = gl.getUniformLocation(program_object, 'view');
    program_object.pLoc = gl.getUniformLocation(program_object, 'projection');
    program_object.mloc = gl.getUniformLocation(program_object, 'model');

    program_object.lightLoc = gl.getUniformLocation(program_object, 'lightPos');

    // Shadow
    program_shadow.vLoc = gl.getUniformLocation(program_shadow, 'view');
    program_shadow.pLoc = gl.getUniformLocation(program_shadow, 'projection');
    program_shadow.mLoc = gl.getUniformLocation(program_shadow, 'model');

    model = initVertexBuffers(gl, program_object);

    object = await readOBJFile('../assets/teapot.obj', 0.25, true);
    if (object) {
        if (buffer(gl, model, object)) { console.log("buffered object"); }
    }

    // Ground
    program_ground.vBuffer = gl.createBuffer();
    program_ground.vBuffer.num = 4;
    program_ground.vBuffer.type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, program_ground.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    program_ground.vPosition = gl.getAttribLocation(program_ground, 'vPosition');
    gl.vertexAttribPointer(program_ground.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_ground.vPosition);


    program_ground.texBuffer = gl.createBuffer();
    program_ground.texBuffer.num = 2;
    program_ground.texBuffer.type = gl.FLOAT;
    gl.bindBuffer(gl.ARRAY_BUFFER, program_ground.texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    program_ground.vTexCoord = gl.getAttribLocation(program_ground, 'vTexCoord');
    gl.vertexAttribPointer(program_ground.vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program_ground.vTexCoord);

    program_ground.idxBuffer = gl.createBuffer();
    program_ground.idxBuffer.type = gl.UNSIGNED_INT;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program_ground.idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    program_ground.vLoc = gl.getUniformLocation(program_ground, 'view');
    program_ground.pLoc = gl.getUniformLocation(program_ground, 'projection');
    program_ground.mLoc = gl.getUniformLocation(program_ground, 'model');
    program_ground.vlightLoc = gl.getUniformLocation(program_ground, 'viewFromLight');




    function animate() {
        projection = perspective(65, canvas.width / canvas.height, 0.01, 10);
        if (rotate) {
            alpha += 0.01;
            lightPos = vec4(radius * Math.sin(alpha), 0, radius * Math.cos(alpha), 0.0);

            gl.useProgram(program_object);
            gl.uniform4fv(program_object.lightLoc, lightPos);

            eye_l = add(vec3(lightPos),lightCenter);
            at_l = vec3(0.0, -1.0, -3.0);

            v_l = lookAt(eye_l, at_l, up);
            p_l = projection;
        }
        if (follow) {
            view = v_l;
        }
        else {view = lookAt(eye, at, up)}
        objectModel = translate(vec3(0.0, yCoord, -3))
        render()
        requestAnimationFrame(animate);
    }
    animate();

    function render() {
        lightView = lookAt(vec3(lightPos), at, up);
        

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program_shadow);

        gl.uniformMatrix4fv(program_shadow.mLoc, false, flatten(objectModel));
        gl.uniformMatrix4fv(program_shadow.vLoc, false, flatten(v_l));
        gl.uniformMatrix4fv(program_shadow.pLoc, false, flatten(p_l));

        gl.disable(gl.CULL_FACE);

        initAttributeVariable(gl, program_object.vPosition, model.vBuffer)
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idxBuffer);
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawGround();
        drawObject();
    }

    function drawGround() {
        

        gl.useProgram(program_ground);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
        gl.uniform1i(gl.getUniformLocation(program_ground, "u_ShadowMap"), 1);
        
        
        initAttributeVariable(gl, program_ground.vPosition, program_ground.vBuffer);
        initAttributeVariable(gl, program_ground.vTexCoord, program_ground.texBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, program_ground.idxBuffer);

        gl.uniformMatrix4fv(program_ground.vLoc, false, flatten(view));
        gl.uniformMatrix4fv(program_ground.pLoc, false, flatten(projection));
        gl.uniformMatrix4fv(program_ground.mloc, false, flatten(mat4()));
        gl.uniformMatrix4fv(program_ground.vlightLoc, false, flatten(v_l));
        gl.uniform1f(gl.getUniformLocation(program_ground, "visibility"), 1.0);

        gl.enable(gl.CULL_FACE)
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    function drawObject() {
        gl.useProgram(program_object);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
        gl.vertexAttribPointer(program_object.vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program_object.vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
        gl.vertexAttribPointer(program_object.vNormal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program_object.vNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer);
        gl.vertexAttribPointer(program_object.vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program_object.vColor);
        

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idxBuffer);
        gl.uniformMatrix4fv(program_object.vLoc, false, flatten(view));
        gl.uniformMatrix4fv(program_object.pLoc, false, flatten(projection));
        gl.uniformMatrix4fv(program_object.mloc, false, flatten(objectModel));
        gl.uniform1f(gl.getUniformLocation(program_object, "visibility"), 1.0);

        gl.disable(gl.CULL_FACE);

        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_INT, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
};


// Load a model from an OBJ file
async function loadModel(path, scale = 0.25) {
    const object = await readOBJFile(path, scale);
    return object;
}


function initAttributeVariable(gl, attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}

function initVertexBuffers(gl, program) {
    var obj = new Object(); // Utilize Object object to return multiple buffer objects
    obj.vBuffer = createEmptyArrayBuffer(gl, program.vPosition, 4, gl.FLOAT);
    obj.vBuffer.num = 4; obj.vBuffer.type = gl.FLOAT;
    obj.nBuffer = createEmptyArrayBuffer(gl, program.vNormal, 4, gl.FLOAT);
    obj.nBuffer.num = 4; obj.nBuffer.type = gl.FLOAT;
    obj.cBuffer = createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT);
    obj.cBuffer.num = 4; obj.cBuffer.type = gl.FLOAT;
    obj.idxBuffer = gl.createBuffer();

    return obj;
    // save me some repetitive writing.
    function createEmptyArrayBuffer(gl, a_attribute, num, type) {
        var buffer = gl.createBuffer();  // Create a buffer object
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        gl.enableVertexAttribArray(a_attribute);  

        return buffer;
    }
};




function buffer(gl, model, drawingInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return true;
}

function initFramebufferObject(gl, width, height) {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    var shadowMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + status.toString());

    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width;
    framebuffer.height = height;
    return framebuffer;
}




