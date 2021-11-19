/*读写本地文件*/
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const history = require('connect-history-api-fallback');
const router = require('./router/index')  //  引入路由

// body-parser application/json解析 extended:false 不使用第三方模块处理参数，使用Nodejs内置模块querystring处理
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json()) //application/x-www-form-urlencoded解析
app.use(history());

//设置跨域访问
app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    if(req.method=="OPTIONS") res.send(200);/*让options请求快速返回*/
    else  next();
});

//  使用路由 /index 是路由指向名称
app.use("/router", router);
let port = 8090;
app.listen(port);
console.info('server start successful!\nport is '+port);
