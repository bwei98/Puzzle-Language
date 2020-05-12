# Puzzle Language
### Brian Wei and Sam Yong

## Requirements
I'm not actually sure, but any reasonable Node JS installation should be fine.

## Running The Code
Run in the working directory ``node puzzle_repl.js``.  This opens the puzzle language repl.  
You can interact in the repl with any valid javascript code as it is simply a js repl.  
However, there are special functionality for the puzzle language.  The following functions can be called:

```
p.load_file(filename) -- Load the cells and rules described in the file
p.set_dim(r,c) -- Set the dimensions of the board to have r rows and c cols
p.initialize(board) -- Set the initial configuration of the board; should be an array of arrays
p.check_rules() -- Returns true if all rules are satisfied, false otherwise
p.solve() -- Solve for a board which satisfies all rules, or indicates if it is not possible
```

## The Puzzle Language
There are two main constructs in the puzzle language: cells and rules.
### Cells
Cells must be defined with the ``cell`` keyword.  Types defined for a cell should be separated with `|`.  
The special keyword ``as`` provides a way to shorthand a type name; the keyword ``is`` may be followed with
``place`` or ``mutate``.  ``mutate`` indicates to the solver that that cells of that type may be changed.  
``place`` indicates cells may be changed to that type.  The ``int`` cell type is special and allows an inputed
range: ``[x..y]`` that the value can take on.  As an example:

```
cell := int [1..3]
      | t1 is mutate
      | longtypename as lt is place
      | t2;
```

In the example, any given cell may be an integer 1,2, or 3, ``t1``, ``longtypename``, or ``t2``.  We see that ``t1``
was specified as mutate, allowing it to be modified.  ``longtypename`` is marked as the same as ``lt`` and specified as
place, allowing it to be put onto the board.  This means that the solver has the option of changing any ``t1`` cells to ``lt``.

### Rules
Rules must be defined after the cell definition.  In the general form rules are to be defined as

```
rule_name := {[r,c] : t} => prop;
```
where ``r,c`` indicate the row and column of the grid, and ``t`` is a specified type.  ``t`` may be either used as a specific type
defined with cell, else it will be used as a variable.  ``prop`` will be a boolean expression that can involve typechecking
(in the same syntax as above), arithmetic, ternary operators, boolean operators (``NOT``, ``AND``, ``OR``).  Any access to the
board which is out of bounds is checked automatically and defaulted to false.

## Example Walkthrough
1. Spin up the repl
```
bash> node puzzle_repl.js
```
2. Load the file ``bridges.puz``.  This file contains cells and rules for the game bridges.  A description can be found 
[here](https://en.wikipedia.org/wiki/Hashiwokakero).
```
puz_repl> p.load_file('bridges.puz')
```
3. Set the dimensions of a board to 3x3 and initialize it as follows
```
puz_repl> p.set_dim(3,3)
puz_repl> p.initialize([[1, 'E', 2],['E', 'E', 'E'],[2, 'E', 3]])
```
4. With this board loaded, we can now check the rules
```
puz_repl> p.check_rules()
```
The output should indicate the the ``rule_counts`` is violated, but all others pass.  We can verify this in the board.

5. We can now try to solve the board with the built-in solver
```
puz_repl> p.solve()
```
The solver is non-deterministic, but it should output a valid solution to the puzzle.

6.  Let's try again with an initial configuration that has no solution.
```
puz_repl> p.initialize([[1, 'E',  2],['E', 'v', 'E'], [2, 'E', 3]])
puz_repl> p.solve()
```
In this example, the vertical line in the middle cannot be satisfied and thus there is no solution.  
The solver will indicate so as well.

## Implementation Design
The language is implemented in javascript as a hybrid of an interpreter and transpiler.  Additionally, the parser works in
close conjunction with these components -- the language is parsed and either interpreted or transpiled in close proximity.
This design allows us to rely heavily on the builtin javascript interpreter when we pull up the repl.

Cells are interpreted directly.  The cell definition produces a structure that contains all the types used by the program.

Rules are transpiled first, then constructed using the ``new Function()`` constructor in javascript.  We choose to transpile 
rules because this allows rules to be more flexible.  The implementation can simply use native javascript for a large portion
of the syntax.

We choose in the end result to be a repl for maximum flexibility and interactivity.  The user is able to play around
with their puzzle like a sandbox, doing whatever they please.  The fact that it is a JS repl also allows them to execute
other javascript code that they may want to to help with their puzzle.

## Future Work
* A better solving algorithm -- the current one is both inefficient and may occasionally produce false negatives
* Extending rules -- Allow for more complex rules such as ones with multiple ``=>`` operators and more advanced
pattern matching capabilities
* Extending cells -- Allow for more arbitrary type declarations including nested types


