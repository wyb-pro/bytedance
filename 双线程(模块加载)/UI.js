//UI.js

//  引入模块

require.register("./foo.js", function(module, exports, require){
    module.exports = function inc(a){
        return a + 1;
    };
});

const inc = require("./foo.js");

/* 获取输入框中的文本输入 */
var msg1 = document.getElementById("msg1");

// 监视 View层的用户输入
msg1.addEventListener("keydown", function (e) {
    if (e.keyCode === 13) {
        console.log(inc(i));
        order();
    }
})

//  检查浏览器是否支持worker
if (typeof (Worker) !== "undefined") {

    // 若下载失败如404，则会默默地失败不会抛异常，即无法通过try/catch捕获。
    var myWorker = new Worker("my_task.js");

    var i = 0;

    // myWorker.postMessage("Hello World!");
    // myWorker.postMessage({method:'echo', args: ['Work']});


    //  指定监听函数，接收子线程发回来的消息
    myWorker.onmessage = function (oEvent) {
        console.log("Worker said : " + oEvent.data.msg);
    };
    document.getElementById("btn").onclick = order
} else {
    alert("不支持web worker ");
}

function order() {
    var msg = document.getElementById("msg1").innerHTML;

    document.getElementById("msg1").innerHTML = " "

    //  向子线程发送消息
    myWorker.postMessage(msg);


    console.log("worker发送的消息", inc(i))

    //  通过代码创建元素
    var div = document.createElement("div");
    div.className = "line";
    var div2 = document.createElement('div');
    div2.innerHTML = msg;
    div2.className = "bg-green own"
    div.appendChild(div2)
    document.getElementById("window-talk").appendChild(div);

    //  监听
    myWorker.onmessage = function (data) {
        var div_inner = document.createElement("div");
        div_inner.className = "line";
        var div2_inner = document.createElement('div');
        div2_inner.innerHTML = msg;
        div2_inner.className = "bg-white other"
        div_inner.appendChild(div2_inner)
        div2_inner.innerHTML = data.data.msg;
        div_inner.appendChild(div2_inner);
        document.getElementById("window-talk").appendChild(div_inner);
    }
}


// worker.postMessage('Send message to worker.') // 发送文本消息
// worker.postMessage({type: 'message', payload: ['hi']}) // 发送JavaScript对象，会先执行序列化为JSON文本消息再发送，然后在接收端自动反序列化为JavaScript对象。
// const uInt8Array = new Uint8Array(new ArrayBuffer(10))
// for (let i = 0; i < uint8array.length; ++i) {
//   uInt8Array[i] = i * 2
// }

// 以先序列化后反序列化的方式发送二进制数据，发送后主线程仍然能访问uInt8Array变量的数据，但会造成性能问题。
// worker.postMessage(uInt8Array)

// 以Transferable Objets的方式发送二进制数据，发送后主线程无法访问uInt8Array变量的数据，但不会造成性能问题，适合用于影像、声音和3D等大文件运算。
// worker.postMessage(uInt8Array, [uInt8Array])