
console.log('test.js载入成功！')


require.register("./foo.js", function(module, exports, require){
    module.exports = function add(a, b){
        return a + b;
    };

    // module.exports = function(x) {
    //   console.log(x);
    // };
});

  require.register("./work.js", function(module, exports, require){
    module.exports = function show_str(){
        return "hello world";
    };
});

  
const add = require('./foo.js');

console.log(add(1, 2));
console.log("require成功!");

const linst = require("./work.js");

console.log(linst());


//   var foo = require("./foo.js");
//   foo("Hi");
//   console.log("require成功!");