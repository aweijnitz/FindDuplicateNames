var fs = require('fs');
var path = require('path');
var UglifyJS = require('uglify-js');


var readFileTree = function (dir, filelist, acceptRegEx) {
  var fs = fs || require('fs'),
    files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(dir + path.sep + file).isDirectory()) {
      filelist = readFileTree(dir + path.sep + file, filelist, acceptRegEx);
    }
    else if (file.match(acceptRegEx)) {
      filelist.push(path.resolve(path.normalize(dir + path.sep + file)));
    }
  });
  return filelist;
};

var baseDir = 'testFiles';
var filesToCheck = readFileTree(baseDir, [], /.*\.js/);
// console.log('FILES: ' + filesToCheck);

// Load all files into the toplevel of the tree
var ast = null;
filesToCheck.forEach(function (file) {
  console.log('loading ' + file);
  var code = fs.readFileSync(file, "utf8");
  ast = UglifyJS.parse(code, {filename: file, toplevel: ast});
});

//console.log(JSON.stringify(ast, null, 4));


// Walk the AST to find dups
// - AST http://lisperator.net/uglifyjs/ast
// - Walker http://lisperator.net/uglifyjs/walk
var walker = new UglifyJS.TreeWalker(function(node){
  if (node instanceof UglifyJS.AST_VarDef) {
    // string_template is a cute little function that UglifyJS uses for warnings
    console.log(UglifyJS.string_template("Found function {name} at {line},{col} in file {file}", {
      name: node.name.name,
      line: node.start.line,
      col: node.start.col,
      file: node.start.file
    }));
  }
});
ast.walk(walker);