(function(){

    /**
     * Gets a WebGL context.
     * makes its backing store the size it is displayed.
     */
    var getWebGLContext = function(canvas) {
        var gl = setupWebGL(canvas);
        return gl;
    };

    /**
     * Creates a webgl context. If creation fails it will
     * change the contents of the container of the <canvas>
     * tag to an error message with the correct links for WebGL.
     * @param {Element} canvas. The canvas element to create a
     *     context from.
     * @param {WebGLContextCreationAttirbutes} opt_attribs Any
     *     creation attributes you want to pass in.
     * @return {WebGLRenderingContext} The created context.
     */
    var setupWebGL = function(canvas, opt_attribs) {
        function showLink(str) {
            var container = canvas.parentNode;
            if (container) {
                container.innerHTML = "<div>"+str+"</div>";
            }
        };

        if (!window.WebGLRenderingContext) {
            showLink("No WebGL supported");
            return null;
        }

        var context = create3DContext(canvas, opt_attribs);
        if (!context) {
            showLink("Random WebGL problem");
            return null;
        }
        return context;
    };

    /**
     * Creates a webgl context.
     * @param {!Canvas} canvas The canvas tag to get context
     *     from. If one is not passed in one will be created.
     * @return {!WebGLContext} The created context.
     */
    var create3DContext = function(canvas, opt_attribs) {
        var names = ["webgl", "experimental-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii], opt_attribs);
            } catch(e) {}
            if (context) {
                break;
            }
        }
        return context;
    };

    /**
     * Loads a shader.
     * @param {!WebGLContext} gl The WebGLContext to use.
     * @param {string} shaderSource The shader source.
     * @param {number} shaderType The type of shader.
     * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
     */
    var loadShader = function(gl, shaderSource, shaderType, opt_errorCallback) {
        var errFn = opt_errorCallback || null;
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
            if (errFn !== null) errFn("*** Error compiling shader '" + shader + "':" + lastError);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    /**
     * Loads a shader from a script tag.
     * @param {!WebGLContext} gl The WebGLContext to use.
     * @param {string} scriptId The id of the script tag.
     * @param {number} opt_shaderType The type of shader. If not passed in it will
     *     be derived from the type of the script tag.
     * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
     */
    var createShaderFromScript = function(
        gl, scriptId, opt_shaderType, opt_errorCallback) {
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

    // export functions

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    /**
     * Creates a program, attaches shaders, binds attrib locations, links the
     * program and calls useProgram.
     * @param {!Array.<!WebGLShader>} shaders The shaders to attach
     * @param {!Array.<string>} opt_attribs The attribs names.
     * @param {!Array.<number>} opt_locations The locations for the attribs.
     */
    var loadProgram = function(gl,shaders,opt_attribs, opt_locations){
        var program = gl.createProgram();
        for (var i = 0; i < shaders.length; i++){
            gl.attachShader(program,shaders[i]);
        }
        if(opt_attribs){
            for (var ii = 0; ii < opt_attribs.length; ++ii) {
                gl.bindAttribLocation(
                    program,
                    opt_locations ? opt_locations[ii] : ii,
                    opt_attribs[ii]);
            }
        }
        gl.linkProgram(program);
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(!linked){
            gl.deleteProgram(program);
            return null;
        }
        return program;
    };

    this.loadProgram = loadProgram;
    this.createShaderFromScript = createShaderFromScript;
    this.getWebGLContext = getWebGLContext;
    this.loadShader = loadShader;


    if (window.requestAnimationFrame){
        /**
         * Provides requestAnimationFrame in a cross browser way.
         */
        window.requestAnimationFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                    return window.setTimeout(callback, 1000/60);
                };
        })();
    }

    if (!window.cancelRequestAnimationFrame){
        /**
         * Provides cancelRequestAnimationFrame in a cross browser way.
         */
        window.cancelRequestAnimationFrame = (function() {
            return window.cancelRequestAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                window.clearTimeout;
        })();
    }


}());