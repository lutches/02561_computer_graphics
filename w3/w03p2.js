window.onload = function init() {
    var canvas = document.getElementById("c");
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    // Set up the clear color
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    // Define the cube vertices
    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
    ];

    // Wireframe indices
    var wire_indices = new Uint32Array([
        1, 0, 3, 3, 2, 1, // front
        2, 3, 7, 7, 6, 2, // right
        3, 0, 4, 4, 7, 3, // down
        6, 5, 1, 1, 2, 6, // up
        4, 5, 6, 6, 7, 4, // back
        5, 4, 0, 0, 1, 5  // left
    ]);



    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let mvplocation = gl.getUniformLocation(program, "MVP");

    let eye = vec3(5, 0.5, 0.5);
    let up = vec3(0, 1, 0);
    let at = vec3(0.5, 0.5, 0.5);
    let V = lookAt(eye, at, up);
    let M = mat4();
    let rx = rotateX(1); 
    
    function render() {
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT);
        aspect = canvas.width / canvas.height;
        //let P = ortho(-1 * aspect, 1 * aspect, -1, 1, 0, 2);
        P = perspective(45, aspect, 0.1, 100);
        M * rx;
        
        let MVP = mult(mult(P, V), M);
        draw(MVP);

    }


    function draw(MVP){
        gl.uniformMatrix4fv(mvplocation, false, flatten(MVP));
        gl.drawElements(gl.TRIANGLES, wire_indices.length, gl.UNSIGNED_INT, 0);
    }

    // Resize handler
    function resize() {
        canvas.width = window.innerWidth - 16;
        canvas.height = window.innerHeight - 16;
        gl.viewport(0, 0, canvas.width, canvas.height);

        render();
    }

    window.addEventListener('resize', resize);

    // Initial resize call to set up the viewport correctly
    resize();
}
