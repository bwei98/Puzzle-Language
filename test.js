
function cell(s) {
    let i;
    if ((i = s.indexOf(':=')) < 0) {
        throw "Syntax Error: Line does not contain \':=\'";
    }
    s = s.substring(i + 2);
    let types = s.split('|');
    let out = {};
    let reserved_ints = [];
    types.forEach(t => {
        t = t.trim();
        if (t.substring(0,3) == 'int') {
            if (reserved_ints.length != 0) {
                throw "Syntax Error: Redefinition of integer";
            }
            let open = t.indexOf('[');
            let close = t.indexOf(']');
            if (open == -1 || close == -1) {
                throw "Syntax Error: Failure in parsing integer typedef";
            }
            t = t.substring(open+1, close);
            let segs = t.split(',');
            segs.forEach(seg => {
                let dots_ind = seg.indexOf('..');
                if (dots_ind == -1) {
                    reserved_ints.push(Number(seg));
                } else {
                    // console.log(seg.substring(0, dots_ind));
                    // console.log(seg.substring(dots_ind+2));
                    reserved_ints.push([Number(seg.substring(0, dots_ind)), Number(seg.substring(dots_ind+2))]);
                }
            });
            out['int'] = reserved_ints;
        }
    });
    types.forEach(t => {
        t = t.trim();
        if (t.substring(0,3) == 'int') {} else {

        let as_index = t.indexOf('as');
        if (as_index != -1) {
            let [long, short] = t.split('as');
            long = long.trim();
            short = short.trim();
            out[short] = long;
        } else {
            out[t] = t;
        }
    }});
    return out;
}


function parse(str) {
    let output = "";
    let types, rules = {};

    str = str.replace(/[\r\v\n\t\f]+/g, '');

    let statements = str.split(';');
    statements.forEach(s => {
        s = s.trim();
        if (s.length == 0 || s.substring(0,2) == "//") {
            console.log("comment: " + s);
        } else  if (s.substring(0,4) == "cell") {
            types = cell(s);
            console.log(types);
        } else if (s.substring(0,4) == "rule") {
        }
    });
    return statements;
}

let program_string = "";

function load_file(filename) {
    const fs = require('fs');
    program_string = fs.readFileSync(filename).toString();;
}

load_file('bridges.puz');

parse(program_string);