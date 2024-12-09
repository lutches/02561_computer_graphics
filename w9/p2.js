
var rotate = false;

window.onload = async function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); // cornflower blue
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.getExtension('OES_element_index_uint');


    let eye = vec3(3, 0, -3);
    let up = vec3(0, 1, 0);
    let at = vec3(0.5, 0.0, -3);
    let View = lookAt(eye, at, up);

    var drawables = [];
    class Drawable {
        constructor(program, model) {
            this.program = program;
            this.model = model;
        }
    }
    class Model {
        constructor(vertices, normals, indices, texCoords) {
            this.vertices = vertices;
            this.normals = normals;
            this.indices = indices;
            this.texCoords = texCoords;
            this.model = mat4();
        }
    }


    var program_obj = initShaders(gl, "vertex-shader-obj", "fragment-shader-obj");

    gl.useProgram(program_obj);

    program_obj.a_Position = gl.getAttribLocation(program_obj, "a_Position");
    program_obj.a_Normal = gl.getAttribLocation(program_obj, "a_Normal");
    program_obj.a_Color = gl.getAttribLocation(program_obj, "a_Color");


    var model = await loadModel("../assets/rat.obj", 0.02);
    model.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(model.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program_obj.a_Position, 4, gl.FLOAT, false, 0, 0);

    model.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(model.normals), gl.STATIC_DRAW);

    model.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

    program_obj.modelLocation = gl.getUniformLocation(program_obj, "model");
    gl.uniformMatrix4fv(program_obj.modelLocation, false, flatten(model.m));
    program_obj.viewLocation = gl.getUniformLocation(program_obj, "view");
    gl.uniformMatrix4fv(program_obj.viewLocation, false, flatten(View));
    program_obj.projectionLocation = gl.getUniformLocation(program_obj, "projection");
    gl.uniform4fv(gl.getUniformLocation(program_obj, "kd"), vec4(0.5, 0.5, 0.5, 1));

    var drawable = new Drawable(program_obj, model);
    drawables.push(drawable);



    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, "a_Position");
    program.a_Tex_Coord = gl.getAttribLocation(program, "a_Tex_Coord");

    program.modelLocation = gl.getUniformLocation(program, "model");
    gl.uniformMatrix4fv(program.modelLocation, false, flatten(mat4()));
    program.viewLocation = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(program.viewLocation, false, flatten(View));
    program.projectionLocation = gl.getUniformLocation(program, "projection");


    // Load the texture image
    var image = new Image();
    image.src = "../assets/xamp23.png";;
    image.onload = function () {
        var texture0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

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
    var model = new Model(vertices, null, indices, texCoords);
    drawables.push(new Drawable(program, model));


    // Vertices Buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(drawables[1].model.vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(drawables[1].program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Index Buffer
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(drawables[1].model.indices), gl.STATIC_DRAW);

    // Texture Buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(drawables[1].model.texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(drawables[1].program, "a_Tex_Coord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var angle = 0;
    var lightcoords = vec4(2, 2, 2, 1);

    let Ms = mat4();
    let MsLocation = gl.getUniformLocation(program_obj, "Ms");

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 80;
        gl.viewport(0, 0, canvas.width, canvas.height);
        var aspect = canvas.width / canvas.height;

        var P = perspective(60, aspect, 1, 100);
        gl.useProgram(program);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, flatten(P));

        initAttributeVariable(gl, program.a_Position, vBuffer, 4);
        initAttributeVariable(gl, program.a_Tex_Coord, tBuffer, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);



        lightcoords = vec4(2 * Math.sin(angle), 2, 2 * Math.cos(angle), 0);
        if (rotate) { console.log(lightcoords) };
        // Draw ground quad with texture 0
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

        gl.useProgram(program_obj);
        initAttributeVariable(gl, program_obj.a_Position, drawables[0].model.vBuffer, 4);
        initAttributeVariable(gl, program_obj.a_Normal, drawables[0].model.normalBuffer, 4);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawables[0].model.indexBuffer);

        gl.uniformMatrix4fv(gl.getUniformLocation(program_obj, "projection"), false, flatten(P));
        gl.uniform1f(gl.getUniformLocation(program_obj, "visibility"), 1);
        gl.uniform4fv(gl.getUniformLocation(program_obj, "lightPos"), lightcoords);
        console.log(lightcoords);
        gl.uniformMatrix4fv(gl.getUniformLocation(program_obj, "yOffset"), false, flatten(translate(0, Math.abs(Math.sin(jumpvalue)/2), 0, 0)));
        gl.uniformMatrix4fv(MsLocation, false, flatten(mat4(0)));

        gl.drawElements(gl.TRIANGLES, drawables[0].model.indices.length, gl.UNSIGNED_INT, 0);

        // Draw the shadow
        Ms = shadowModel(lightcoords);
        gl.uniformMatrix4fv(MsLocation, false, flatten(Ms));
        gl.uniform1f(gl.getUniformLocation(program_obj, "visibility"), 0.6);
        gl.drawElements(gl.TRIANGLES, drawables[0].model.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    let jumpvalue = 0;
    function animate() {

        if (rotate) { angle += 3.14 / 60; }
        jumpvalue += 0.05;
        render();
        requestAnimationFrame(animate);
    }



    document.getElementById('rotate-switch').addEventListener('change', function () { rotate = this.checked; console.log(rotate); });
    animate();

};

function shadowModel(lightcoords) {

    // Translation matrix to move light to origin (T_{-pℓ})
    var T = translate(lightcoords[0], lightcoords[1], lightcoords[2]);
    var nT = translate(-lightcoords[0], -lightcoords[1], -lightcoords[2]);

    // Projection matrix (Mp) that projects onto the y = groundLevel plane
    var d = -1.8789; // if -3 the shadow will clip with the ground
    var Mp = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.0 / d, 0, 0);

    // Compute Ms by combining the matrices: Ms = Tpℓ * Mp * T−pℓ * M
    let Ms = mult(mult(T, Mp), nT);

    return Ms;
}

// Load a model from an OBJ file
async function loadModel(path, scale = 0.2) {
    const object = await readOBJFile(path, scale); // Assumes `readOBJFile` is a function to parse OBJ files.

    object.m = mult(translate(vec3(0, -1.12, -3)), mat4(
        0, 0, 1, 0,
        0, 1, 0, 0,
        -1, 0, 0, 0,
        0, 0, 0, 1
    ));
    return object;
}

function initAttributeVariable(gl, attribute, buffer, n) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, n, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}