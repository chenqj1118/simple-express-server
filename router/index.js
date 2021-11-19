/*
* simple server
* */
const fs = require('fs')
const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  console.log('api:' + req.originalUrl);
  next()
})


router.get(`/`, (req, res, next) => {
  res.json({
    status: 200,
    data: `请求成功`
  })
})

/*
* post请求返回的数据格式
* */
let resJsonData = (res,message,data) => {
  res.json({
    success:true,
    message: message,
    status: 200,
    data: !data?'':data
  });
}

/*
* 注册账号时，同时创建与账号同名的文件夹并生成group.json
* */
router.post('/xxx', (req, res, next) => {
  if (!fs.existsSync(req.body.xxxPath)) {
	resJsonData(res,"xxx成功")
  }else {
    res.json({
      success:false,
      message: '已存在！'
    });
  }
});

module.exports = router;
