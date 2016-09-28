(function (global) {
    var INITIAL_STATE = {
        isDoneHeader       : false,
        hasWrittenStyleTag : false,
    };

    var RE_HEADER_IGNORE = /^(WEBVTT|Kind:|Language:|Style:)+.*$/;
    var RE_HEADER_DONE   = /^##+$/;

    var RE_REPLACE_STYLE1 = /::cue\(/g;
    var RE_REPLACE_STYLE2 = /\) {/g;
    var RE_REPLACE_STYLE3 = /\./g;

    var RE_BODY_IGNORE      = /^[0-9]+:[0-9]+:[0-9]+.*$/;
    var RE_BODY_REPLACE_TAG = /(<c\.color[A-Za-z0-9]{6}>|<\/c>|<[0-9]+:[0-9]+:[0-9]+.[0-9]+>|<c>)+/g;

    var state;

    function resetState() {
        state = {};
        Object.keys(INITIAL_STATE).forEach(function (k) {
            state[k] = false;
        });
    }

    /**
     * @param {string} line
     * @returns {string}
     */
    function getStyleRule(line) {
        return line
            .replace(RE_REPLACE_STYLE1, '')
            .replace(RE_REPLACE_STYLE2, ' {')
            .replace(RE_REPLACE_STYLE3, '\\.');
    }

    /**
     * @param {string} line
     * @returns {string}
     */
    function getBodyLine(line) {
        return line.replace(RE_BODY_REPLACE_TAG, '');
    }

    /**
     * @param {string} line
     * @returns {undefined|string}
     */
    function processHeaderLine(line) {
        if (RE_HEADER_IGNORE.test(line)) {
            return;
        } else if (RE_HEADER_DONE.test(line)) {
            state.isDoneHeader = true;
            return '</style>';
        } else {
            if (!state.hasWrittenStyleTag) {
                state.hasWrittenStyleTag = true;
                return '<style>' + getStyleRule(line);

            } else {
                return getStyleRule(line);
            }
        }
    }

    /**
     * @param {string} line
     * @returns {undefined|string}
     */
    function processBodyLine(line) {
        if (RE_BODY_IGNORE.test(line)) {
            return;
        } else {
            return getBodyLine(line).trim();
        }
    }

    /**
     * @param {string} line
     * @returns {string}
     */
    function processLine(line) {
        if (state.isDoneHeader) {
            return processBodyLine(line);
        } else {
            return processHeaderLine(line);
        }
    }

    var prevLine;

    /**
     * @param {string} line
     * @returns {undefined|string}
     */
    function removeDuplicateLines(line) {
        if (line === prevLine) {
            prevLine = line;
            return;
        } else {
            prevLine = line;
            return line;
        }
    }

    /**
     * @param {string} line
     * @param {number} i
     * @param {array} a
     * @returns {undefined|string}
     */
    function removeForwardPartialDuplicates(line, i, a) {
        if (a[i + 1] && a[i + 1].trim() === line.trim()) {
        } else {
            return line;
        }
    }

    /**
     * @param {string} text
     * @returns {string[]}
     */
    function process(text) {
        resetState();

        var lines = text.split('\n');

        lines = lines
            .map(processLine)
            .filter(Boolean)
            .map(removeDuplicateLines)
            .filter(Boolean)
            .map(removeForwardPartialDuplicates)
            .filter(Boolean);

        return lines;
    }

    /** @namespace */
    global.VTT = {
        process : process
    };
})(window);