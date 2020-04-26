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
        if (t.substring(0, 3) == 'int') {
            if (reserved_ints.length != 0) {
                throw "Syntax Error: Redefinition of integer";
            }
            let open = t.indexOf('[');
            let close = t.indexOf(']');
            if (open == -1 || close == -1) {
                throw "Syntax Error: Failure in parsing integer typedef";
            }
            t = t.substring(open + 1, close);
            let segs = t.split(',');
            segs.forEach(seg => {
                let dots_ind = seg.indexOf('..');
                if (dots_ind == -1) {
                    reserved_ints.push(Number(seg));
                } else {
                    reserved_ints.push([Number(seg.substring(0, dots_ind)),
                        Number(seg.substring(dots_ind + 2))
                    ]);
                }
            });
            out['int'] = reserved_ints;
        }
    });
    types.forEach(t => {
        t = t.trim();
        if (t.substring(0, 3) == 'int') {} else {

            let as_index = t.indexOf('as');
            if (as_index != -1) {
                let [long, short] = t.split('as');
                long = long.trim();
                short = short.trim();
                out[short] = long;
            } else {
                out[t] = t;
            }
        }
    });
    return out;
}

/* Input should be of the form [a,b]:type_name num, where num is optional */
function parse_type(types, s) {
    s = s.trim();
    let out = {};
    let colon = s.indexOf(':');
    if (colon < 0) throw "Syntax Error: type could not be parsed";
    let cell_str = s.substring(0, colon).trim();
    let type_str = s.substring(colon + 1).trim();
    if (type_str.indexOf(' ') < 0) {
        for (let t in types) {
            if (type_str == t || type_str == types[t]) {
                out['type'] = t;
                break;
            }
        }
    } else {
        let parts = type_str.split(' ');
        if (parts.length != 2) throw "Syntax Error: type could not be parsed";
        parts[0] = parts[0].trim();
        parts[1] = parts[1].trim();
        if (parts[0] != 'int') throw "Syntax Error: compount types only supported for ints";
        for (let t in types) {
            if (t != 'int') continue;
            out['type'] = 'int';
            // TODO finish this
        }
        if (out['type'] == undefined) throw "Syntax Error: type could not be parsed";
    }
    cell_str = cell_str.substring(1, cell_str.length - 1);
    let cell_vars = cell_str.split(',');
    cell_vars.forEach(s => s.trim());
    out['cell_vars'] = cell_vars;
    return out;
}

function rule(types, s) {
    let out = {};
    let i;
    if ((i = s.indexOf(':=')) < 0) {
        throw "Syntax Error: Line does not contain \':=\'";
    }
    out['name'] = s.substring(0, i).trim();
    s = s.substring(i + 2);
    if ((i = s.indexOf('=>')) < 0) {
        throw "Syntax Error: Rule does not contain \'=>\'";
    }
    let func_content = 'const grid_rows = grid.length;\n' +
        'const grid_cols = grid[0].length;\n' +
        'for(let r = 0; r < grid_rows; r++) {\n' +
        '\tfor(let c = 0; c < grid_cols; c++) {\n';

    let predicate = s.substring(0, i).trim();
    const t_open = predicate.indexOf('{');
    const t_close = predicate.indexOf('}');
    if (t_open < 0 || t_close < 0 || t_open > t_close) {
        throw "Syntax Error: Rule predicate does not contain {}";
    }
    predicate = predicate.substring(t_open + 1, t_close);
    pred_type = parse_type(types, predicate);
    let r = pred_type['cell_vars'][0],
        c = pred_type['cell_vars'][1];
    func_content += '\t\tlet ' + r + ' = r; let ' + c + ' = c;\n';
    func_content += '\t\tif (grid[' + r + '][' + c + '] != \'' + pred_type['type'] + '\') continue;\n'
    s = s.substring(i + 2).trim();
    while (s.indexOf('{') >= 0) {
        const c_open = s.indexOf('{');
        const c_close = s.indexOf('}');
        if (c_close < 0 || c_open > c_close) {
            throw "Syntax Error: Rule {} mismatch";
        }
        let current = s.substring(c_open + 1, c_close);
        curr_type = parse_type(types, current);
        let x = curr_type['cell_vars'][0],
            y = curr_type['cell_vars'][1]
        s = s.slice(0, c_open) + '((' + x + ')< 0 || (' + x + ') >= grid_rows || (' +
            y + ') < 0 || (' + y + ') >= grid_cols || (grid[' + x + '][' +
            y + '] == \'' + curr_type['type'] + '\'))' +
            s.slice(c_close + 1);
    }
    func_content += "\t\tif (!(" + s + "))\n\t\t\treturn false;\n"

    func_content += '\t}\n}\nreturn true;';
    func_content = func_content.replace(/OR/g, '||');
    func_content = func_content.replace(/AND/g, '&&');
    func_content = func_content.replace(/NOT/g, '!');


    out['func'] = new Function('grid', func_content);
    return out;
}

function parse(str) {
    let output = "";
    let types, rules = {}

    str = str.replace(/[\r\v\n\t\f]+/g, '');

    let statements = str.split(';');
    statements.forEach(s => {
        s = s.trim();
        if (s.length == 0 || s.substring(0, 2) == "//") {
            console.log("comment: " + s);
        } else if (s.substring(0, 4) == "cell") {
            types = cell(s);
        } else if (s.substring(0, 4) == "rule") {
            let next_rule = rule(types, s);
            rules[next_rule['name']] = next_rule['func'];
        }
    });
    return types, rules;
}

let program_string = "";
let types, rules;
let grid;

function load_file(fname) {
    const fs = require('fs');
    program_string = fs.readFileSync(fname).toString();
    types, rules = parse(program_string);
}

function set_dim(r, c) {
    grid = new Array(r);
    for (let i = 0; i < c; i++) {
        grid[i] = new Array(c);
    }
}

function initialize(a_args) {
    if (grid == undefined) {
        throw "Error: Grid dimensions not set";
    }
    if (a_args.length != grid.length) {
        throw "Error: Invalid dimension";
    }
    for (let i = 0; i < grid.length; i++) {
        if (grid[0].length != a_args[i].length) {
            throw "Error: Invalid dimension";
        }
    }
    grid = a_args;   
}

module.exports = {
    load_file: load_file,
    set_dim: set_dim,
    initialize: initialize
}