var gl;
var canvas;

var pointArray = [];
var normalsArray = [];
var colors = [];
var numSubdivisions = 8;


var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

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

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    /////////////////////////////////////////////////////////////////////
    // Texture

    
    
    var image = document.createElement('img');
    image.onload = function () {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    };
    image.src = "../assets/earth.jpg";

    var textureLocation = gl.getUniformLocation(gl.program, "texture");
    gl.uniform1i(textureLocation, 0);

    // vertex position
    gl.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);

    const vPosition = gl.getAttribLocation(gl.program, "vertex_position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);





    //////////////////////////////////////////////////////////////////////
    // region camera

    // Perspective is made in the render function to handle resizing of the window

    var lightPos = vec4(0.0, 0.0, -1.0, 0.0);
    var lightPosLocation = gl.getUniformLocation(gl.program, 'lightPos');
    gl.uniform4fv(lightPosLocation, flatten(lightPos));

    var lightColor = vec4(1.0, 1.0, 1.0, 1.0);
    var lightColorLocation = gl.getUniformLocation(gl.program, 'lightColor');
    gl.uniform4fv(lightColorLocation, flatten(lightColor));
    //////////////////////////////////////////////////////////////////////
    // Buttons

    var rotate = document.getElementById("rotate");
    rotate.addEventListener('click', function () { orbiting = !orbiting; });

    var increase = document.getElementById("increase");
    increase.addEventListener('click', function () {
        if (numSubdivisions < 10) {
            numSubdivisions++;
        }
        initSphere(gl, numSubdivisions);

    });

    var decrease = document.getElementById("decrease");
    decrease.addEventListener('click', function () {
        if (numSubdivisions > 0) {
            numSubdivisions--;
        }
        initSphere(gl, numSubdivisions);
    });

    //////////////////////////////////////////////////////////////////////

    initSphere(gl, numSubdivisions);


    function render() {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        var aspect = canvas.width / canvas.height;
        var P = perspective(60, aspect, 1, 100);
        gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "cameraProjectionMatrix"), false, flatten(P));

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        if (orbiting) {
            orbitAngle += 0.003
        }
        var at = vec3(0, 0, 0);
        var eye = vec3(orbitRadius * Math.sin(orbitAngle), 0.0, orbitRadius * Math.cos(orbitAngle));
        var up = vec3(0, 1, 0);

        var modelviewmatrix = lookAt(eye, at, up);

        var modelviewLocation = gl.getUniformLocation(gl.program, 'modelViewMatrix');
        gl.uniformMatrix4fv(modelviewLocation, false, flatten(modelviewmatrix));

        gl.drawArrays(gl.TRIANGLES, 0, pointArray.length);

        requestAnimationFrame(render);  
    }
    render();
}




function initSphere(gl, numSubdivisions) {
    pointArray = [];
    normalsArray = [];

    tetrahedon(va, vb, vc, vd, numSubdivisions);


    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointArray), gl.STATIC_DRAW);
}

function tetrahedon(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

function triangle(a, b, c) {
    pointArray.push(a);
    pointArray.push(b);
    pointArray.push(c);

    normalsArray.push(a);
    normalsArray.push(b);
    normalsArray.push(c);
}




