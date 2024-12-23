var textureWrap = 0
var textureFilter = 0


window.onload = function init() {
    var canvas = document.getElementById("webgl-canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0); //cornflower blue
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var numVertices = 4;

    var view = mat4();
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, flatten(view));

    var P = perspective(90, 1, 1, 100);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "perspective"), false, flatten(P));

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    const texSize = 64;
    const numRows = 8;
    const numCols = 8;
    var myTexels = new Uint8Array(4 * texSize * texSize); // 4 for RGBA image, texSize is the resolution

    for (var i = 0; i < texSize; ++i) {
        for (var j = 0; j < texSize; ++j) {
            var patchx = Math.floor(i / (texSize / numRows));
            var patchy = Math.floor(j / (texSize / numCols));
            var c = (patchx % 2 !== patchy % 2 ? 255 : 0);
            var idx = 4 * (i * texSize + j);
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
            myTexels[idx + 3] = 255;
        }
    }

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.generateMipmap(gl.TEXTURE_2D)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    var quadVertices = [
        vec4(-4, -1, -1, 1),
        vec4(4, -1, -1, 1),
        vec4(4, -1, -21, 1),
        vec4(-4, -1, -21, 1)
    ];

    var texCoords = [
        vec2(-1.5, 0),
        vec2(2.5, 0),
        vec2(2.5, 10),
        vec2(-1.5, 10)
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadVertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "a_Tex_Coord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    window.onresize = render;

    var wrap = document.getElementById("textureWrap");
    wrap.addEventListener("change", function (ev) {
        switch (Number(wrap.value)) {
            case 0:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
            case 1:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break;
        }
        requestAnimationFrame(render);
    });

    var mag = document.getElementById("magFilter");
    mag.addEventListener("change", function (ev) {
        switch (Number(mag.value)) {
            case 0:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                break;
            case 1:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;
        }
        requestAnimationFrame(render);
    });

    var min = document.getElementById("minFilter");
    min.addEventListener("change", function (ev) {
        switch (Number(min.value)) {
            case 0:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                break;
            case 1:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                break;
            case 2:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);

                break;
            case 3:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

                break;
            case 4:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);

                break;
            case 5:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

                break;
        }
        requestAnimationFrame(render);
    });


    function render() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 80;
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = canvas.width / canvas.height

        var P = perspective(65, aspect, 1, 100);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "perspective"), false, flatten(P));

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, numVertices);
    }
    render();
}
