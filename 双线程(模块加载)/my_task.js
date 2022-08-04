//my_task.js

var send = ['已实现双线程', '模块加载成功', '演示结束']
var i = 0;

onmessage = function (e) {//对主线程回传回来的消息进行处理

    console.log("Main Said: " + e.data)

    postMessage({
        time: new Date(),
        msg: send[i]
    });

    i == 2 ? i = 0 : i + 1;
};

