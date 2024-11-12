window.onload = function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); // cornflower blue
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var numVertices = 12; // 4 vertices per quad, 3 quads

    var view = mat4();
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, flatten(view));

    var P = perspective(90, 1, 1, 100);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "perspective"), false, flatten(P));

    // Load the texture image
    var image = new Image();
    image.src = "xamp23.png";
    image.onload = function() {
        var texture0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create red texture
        var texture1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        var redTexel = new Uint8Array([255, 0, 0, 255]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, redTexel);

        // Define vertices and texture coordinates
        var vertices = [
            // Ground quad
            vec4(-2, -1, -1, 1),
            vec4(2, -1, -1, 1),
            vec4(2, -1, -5, 1),
            vec4(-2, -1, -5, 1),
            // Smaller quad above ground
            vec4(0.25, -0.5, -1.25, 1),
            vec4(0.75, -0.5, -1.25, 1),
            vec4(0.75, -0.5, -1.75, 1),
            vec4(0.25, -0.5, -1.75, 1),
            // Smaller quad perpendicular to ground
            vec4(-1, -1, -2.5, 1),
            vec4(-1, 0, -2.5, 1),
            vec4(-1, 0, -3, 1),
            vec4(-1, -1, -3, 1)
        ];

        var texCoords = [
            // Ground quad
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 1),
            // Smaller quad above ground
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 1),
            // Smaller quad perpendicular to ground
            vec2(0, 0),
            vec2(1, 0),
            vec2(1, 1),
            vec2(0, 1)
        ];

        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        var tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

        var vTexCoord = gl.getAttribLocation(program, "a_Tex_Coord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);

        function render() {
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Draw ground quad with texture 0
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            // Draw smaller quads with texture 1
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
            gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
            gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
        }
        render();
    };
};   