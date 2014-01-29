/**
 * Impl overtime-swaps
 *
 * Name: smila2
 * User: Baka (Julian)
 * Date: 23.01.14
 * Time: 23:00
 */
window.Smila = function () {

    var VERBOSE = true;
    var ELEMENT_NAME = "smila";
    var EXPECTED_ELAPSED_MILLIS = Math.floor(1000 / 60);

    function Smila() {
    };


    var rendererIsStarted = false;
    var canvas = null;
    var gl = null;
    var colorLocation = null;
    var resolutionLocation = null;
    var positionLocation = null;
    var buffer;
    var program;
    var thread = null;

    /**
     *
     * @type {Object}
     */
    var Renderer = Smila.Renderer = {

        /**
         * Amount of Sprites the Renderer can take for the beginning
         */
        startSize:100,

        start:function () {
            log("[Smila::Renderer]->start")
            if (rendererIsStarted) throw "[Smila::Renderer]->start : Already started!";
            else {
                var parent = document.getElementById(ELEMENT_NAME);
                canvas = document.createElement('canvas');
                canvas.height = parent.clientHeight;
                canvas.width = parent.clientWidth;
                parent.appendChild(canvas);

                try {
                    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                } catch (e) {
                    log("[Smila::Renderer]->start | Webgl-Error: " + e);
                }

                if (gl) {
                    rendererIsStarted = true;

                    //todo inject shaders


                    // setup a GLSL program
                    var vertexShader = createShaderFromScript(gl, "2d-vertex-shader");
                    var fragmentShader = createShaderFromScript(gl, "2d-fragment-shader");
                    program = loadProgram(gl, [vertexShader, fragmentShader]);
                    gl.useProgram(program);

                    // look up where the vertex data needs to go.
                    positionLocation = gl.getAttribLocation(program, "a_position");

                    // Create a buffer and put a single clipspace rectangle in
                    // it (2 triangles)
                    buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);


                    // set the resolution
                    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
                    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                    colorLocation = gl.getUniformLocation(program, "u_color");

                    // setup a rectangle from 10,20 to 80,30 in pixels
                    /*
                     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                     10, 20,
                     80, 20,
                     10, 30,
                     10, 30,
                     80, 20,
                     80, 30]), gl.STATIC_DRAW);
                     */


                    gl.enableVertexAttribArray(positionLocation);
                    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

                    thread = requestAnimationFrame(Renderer.update);

                } else {
                    log("[Smila::Renderer]->start | failed, webgl not supported");
                }
            }
        },

        update : function(){

            var now = new Date().getTime(),
                elapsed = now - (Renderer.time || now);
            Renderer.time = now;
            var dt = elapsed / EXPECTED_ELAPSED_MILLIS;

            
            thread = requestAnimationFrame(Renderer.update);
        },

        /**
         * draws a Rectangle onto the canvas
         */
        drawRect:function (x, y, w, h) {
            if (!rendererIsStarted) throw "[Smila::Renderer]->drawRect | Cannot draw Rectangle without the Renderer beeing started!";
            var x1 = x;
            var x2 = x + w;
            var y1 = y;
            var y2 = y + h;
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2
            ]), gl.STATIC_DRAW);
            gl.uniform4f(colorLocation, 255, 0, 0, 1);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },


        drawSprite:function (img) {

            // look up where the vertex data needs to go.
            var positionLocation = gl.getAttribLocation(program, "a_position");
            var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

            // provide texture coordinates for the rectangle.
            var texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

            // Create a texture.
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            // lookup uniforms
            var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

            // set the resolution
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

            // Create a buffer for the position of the rectangle corners.
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            // Set a rectangle the same size as the image.
            setRectangle(gl, 20, 0, img.width, img.height);

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        }
    };

    //*************************************************************************
    // H E L P E R  F U N C T I O N
    //*************************************************************************

    function setRectangle(gl, x, y, width, height) {
        var x1 = x;
        var x2 = x + width;
        var y1 = y;
        var y2 = y + height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2]), gl.STATIC_DRAW);
    }

    /**
     * Loads a shader from a script tag.
     * @param {!WebGLContext} gl The WebGLContext to use.
     * @param {string} scriptId The id of the script tag.
     * @param {number} opt_shaderType The type of shader. If not passed in it will
     *     be derived from the type of the script tag.
     * @param {function(string): void) opt_errorCallback callback for errors.
     * @return {!WebGLShader} The created shader.
     */
    var createShaderFromScript = function (gl, scriptId, opt_shaderType, opt_errorCallback) {
        var shaderSource = "";
        var shaderType;
        var shaderScript = document.getElementById(scriptId);
        if (!shaderScript) {
            throw("*** Error: unknown script element" + scriptId);
        }
        shaderSource = shaderScript.text;

        if (!opt_shaderType) {
            if (shaderScript.type == "x-shader/x-vertex") {
                shaderType = gl.VERTEX_SHADER;
            } else if (shaderScript.type == "x-shader/x-fragment") {
                shaderType = gl.FRAGMENT_SHADER;
            } else if (shaderType != gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER) {
                throw("*** Error: unknown shader type");
                return null;
            }
        }

        return loadShader(
            gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
            opt_errorCallback);
    };

    /**
     * Loads a shader.
     * @param {!WebGLContext} gl The WebGLContext to use.
     * @param {string} shaderSource The shader source.
     * @param {number} shaderType The type of shader.
     * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
     */
    var loadShader = function (gl, shaderSource, shaderType, opt_errorCallback) {
        var errFn = opt_errorCallback || error;
        // Create the shader object
        var shader = gl.createShader(shaderType);

        // Load the shader source
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check the compile status
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            // Something went wrong during compilation; get the error
            lastError = gl.getShaderInfoLog(shader);
            errFn("*** Error compiling shader '" + shader + "':" + lastError);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    /**
     * Creates a program, attaches shaders, binds attrib locations, links the
     * program and calls useProgram.
     * @param {!Array.<!WebGLShader>} shaders The shaders to attach
     * @param {!Array.<string>} opt_attribs The attribs names.
     * @param {!Array.<number>} opt_locations The locations for the attribs.
     */
    var loadProgram = function (gl, shaders, opt_attribs, opt_locations) {
        var program = gl.createProgram();
        for (var ii = 0; ii < shaders.length; ++ii) {
            gl.attachShader(program, shaders[ii]);
        }
        if (opt_attribs) {
            for (var ii = 0; ii < opt_attribs.length; ++ii) {
                gl.bindAttribLocation(
                    program,
                    opt_locations ? opt_locations[ii] : ii,
                    opt_attribs[ii]);
            }
        }
        gl.linkProgram(program);

        // Check the link status
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            // something went wrong with the link
            lastError = gl.getProgramInfoLog(program);
            error("Error in program linking:" + lastError);

            gl.deleteProgram(program);
            return null;
        }
        return program;
    };

    /**
     * Wrapped logging function.
     * @param {string} msg The message to log.
     */
    var error = function (msg) {
        if (window.console) {
            if (window.console.error) {
                window.console.error(msg);
            }
            else if (window.console.log) {
                window.console.log(msg);
            }
        }
    };

    var log = function (message) {
        if (VERBOSE) console.log(message);
    };

    // POLYFILLS

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;


    return Smila;
}();