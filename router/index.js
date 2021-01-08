/*
* BOKECMS server
* */
const fs = require('fs')
const path = require('path')
const express = require('express');
const router = express.Router();
const globalConfig = require('../globalConfig');
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

const utils = require('./utils');
const projectPath = globalConfig.rootPath //存放用户及项目数据的目录，可自行修改
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
router.post('/register', (req, res, next) => {
  let groupJson = [{'groupName':"默认分组",'groupDesc':"", 'groupID': '-1'}];
  if (!fs.existsSync(path.join(projectPath, req.body.username))) {
    utils.mkdirsSync(path.join(projectPath, req.body.username));
    utils.writeFileTxt(path.join(projectPath, req.body.username, 'group.json'), JSON.stringify(groupJson,null,4),()=>{
      resJsonData(res,"注册成功")
    });
  }else {
    res.json({
      success:false,
      message: groupJson.groupName + '已存在!'
    });
  }
});

/*
*定义接口  新建项目
* */
router.post('/createProject', (req, res, next) => {
  let username = req.body.username,
    formData = req.body.formData;
  let myPath = path.join(projectPath, username, formData.code);
  if (!fs.existsSync(myPath)) { // 项目不存在则新建
    utils.mkdirsSync(myPath);
    formData.updateTime = new Date().getTime();
    utils.writeFileTxt(path.join(myPath, formData.code + '.json'), JSON.stringify(formData,null,4), () => {
      utils.initWebUI(username, formData.code, 'vue');
      utils.mkdirsSync(path.join(myPath, 'designData'));
      resJsonData(res,"创建成功", formData)
    })
  } else { // 项目已存在，则直接读取
    utils.readFileTxt(path.join(myPath, formData.code + '.json'), (txt) => {
      resJsonData(res, '目录已存在!', JSON.parse(txt));
    });
  }
});

/*
*读取当前账号项目列表
* @param username 账户名
* */
router.post('/getProjectData', (req, res, next) => {
  let params = req.body,projectData = [];
  let proPath = path.join(projectPath, params.username);
  if (projectPath) {
    try { // 捕获path目录不存在而报错
      let files = fs.readdirSync(proPath);
      files = files.filter(item => { // 过滤掉group
        return fs.statSync(path.join(proPath, item)).isDirectory();
      });
      projectData = files;
      if (params.groupID) {
        projectData = files.filter((item) => {
          let projectD = JSON.parse(fs.readFileSync(path.join(proPath, item, item + '.json')));
          return projectD.groupID === params.groupID;
        });
      }
      projectData.sort((a, b) => {
        return b.updateTime - a.updateTime;
      });
      projectData && resJsonData(res,"读取项目列表成功", projectData)
    } catch (e) {
      console.log(e);
      res.json({
        success:false,
        message: e + '项目异常!'
      });
    }
  } else {
    res.json({
      success:false,
      message: '请先注册!'
    });
  }
});

/*
*读取当前账号下指定项目数据
* @param username 账户名
* @param projectCode 账户名
* */
router.post('/getCurrentProjectData', (req, res, next) => {
  let params = req.body;
  let proPath = path.join(projectPath, params.username, params.projectCode, params.projectCode + '.json');
  if (fs.existsSync(proPath)) {
    try { // 捕获path目录不存在而报错
      let projectData = JSON.parse(fs.readFileSync(proPath));
      projectData && resJsonData(res,"读取项目列表成功", projectData)
    } catch (e) {
      console.log(e);
      res.json({
        success:false,
        message: e + '项目异常!'
      });
    }
  } else {
    res.json({
      success:false,
      message: '项目不存在!'
    });
  }
});

/*
*读取当前账号分组列表
* @param username 账户名
* */
router.post('/getGroupData', (req, res, next) => {
  let params = req.body;
  let groupPath = path.join(projectPath, params.username, 'group.json');
  if (projectPath) {
    try { // 捕获path目录不存在而报错
      utils.readFileTxt(groupPath, txt => {
        txt && resJsonData(res,"读取分组信息成功", JSON.parse(txt));
      });
    } catch (e) {
      console.log(e);
      res.json({
        success:false,
        message: e + '分组异常!'
      });
    }
  }
});

/*
*添加分组
* */
router.post('/addGroup', (req, res, next) => {
  let params = req.body;
  utils.writeFileTxtSync(path.join(projectPath, params.username, 'group.json'), JSON.stringify(params.formData,null,4));
  resJsonData(res,"添加分组成功")
});

/*
*获取登录账户的指定项目的数据对象
* @param username 账户名
* @param projectCode 项目编码
* */
router.post('/getDataObject', (req, res, next) => {
  let params = req.body;
  let proPath = path.join(projectPath, params.username, params.projectCode);
  if (fs.existsSync(proPath)) {
    try { // 捕获path目录不存在而报错
      let files = fs.readdirSync(path.join(proPath, 'DataObject'));
      let projectData = {};
      files = files.filter(item => { // 遍历文件夹并读取文件内容
        itemPath = path.join(proPath, 'DataObject', item);
        if (item.endsWith('.xml')) {
          utils.xml2json(fs.readFileSync(path.join(proPath, 'DataObject', item), 'utf-8'), (json) => {
            projectData[item] = json;
          })
        } else if (fs.lstatSync(itemPath).isDirectory()) { // 判断是否是文件夹
          let itemObj = {};
          fs.readdirSync(itemPath).forEach((element) => { 
            utils.xml2json(fs.readFileSync(path.join(itemPath, element), 'utf-8'), (json) => {
              itemObj[element] = json;
            })
          })
          projectData[item] = itemObj
        }
      });
      projectData && resJsonData(res,"读取项目数据成功", projectData)
    } catch (e) {
      res.json({
        success:false,
        message: e + '项目异常!'
      });
    }
  } else {
    res.json({
      success:false,
      message: '项目不存在!'
    });
  }
});

/*
*存储登录账户的指定项目的数据对象
* @param username 账户名
* @param projectCode 项目编码
* */
router.post('/saveDataObject', (req, res, next) => {
  let params = req.body;
  let proPath = path.join(projectPath, params.username, params.projectCode);
  if (fs.existsSync(proPath)) {
    try { // 捕获path目录不存在而报错
      if (params.secIndex) {
        utils.writeFileTxt(path.join(proPath, 'DataObject', params.data.Caption, params.secIndex), utils.json2xml(params.data[params.secIndex].DataObject), () => {
          resJsonData(res,"保存数据成功", utils.json2xml(params.data[params.secIndex].DataObject))
        })
      } else {
        utils.writeFileTxt(path.join(proPath, 'DataObject', params.data.Key + '.xml'), utils.json2xml(params.data), () => {
          resJsonData(res,"保存数据成功", utils.json2xml(params.data))
        })
      }
    } catch (e) {
      res.json({
        success:false,
        message: e + '项目异常!'
      });
    }
  } else {
    res.json({
      success:false,
      message: '项目不存在!'
    });
  }
});

/*
*读取当前项目页面列表
*@param username 账户名
*@param projectCode 项目编码
* */
router.post('/queryPageList', (req, res, next) => {
  let params = req.body;
  let proPath = path.join(projectPath, params.username, params.projectCode, 'designData');
  let pageArr = [];
  if (projectPath) {
    try { // 捕获path目录不存在而报错
      let files = fs.readdirSync(proPath);
      files.forEach(item => {
        let data = JSON.parse(fs.readFileSync(path.join(proPath, item)))
        pageArr.push(data);
      })
      resJsonData(res,"读取页面列表成功", pageArr)
    } catch (e) {
      res.json({
        success:false,
        message: e + '读取页面列表异常!'
      });
    }
  } else {
    res.json({
      success:false,
      message: '请先注册!'
    });
  }
});

/*
*新建页面
*@param username 账户名
*@param projectCode 项目编码
*@param pageCode 页面code
* */
router.post('/createPage', (req, res, next) => {
  let params = req.body,
    formData = params.formData;
    console.log(1111, params.username);
  let myPath = path.join(projectPath, params.username, formData.projectCode, 'designData');
  if (fs.existsSync(myPath)) {
    utils.writeFileTxt(path.join(myPath, formData.code + '.json'), JSON.stringify(formData,null,4), () => {
      resJsonData(res,"创建成功", formData)
    })
  } else {
    res.json({
      success:false,
      message: formData.code + '目录异常!'
    });
  }
});

/*
* DataObject下新建文件夹 作分类用
* @param username 账户名 projectCode 项目编码
* */
router.post('/createNewFolder', (req, res, next) => {
  let params = req.body, formData = params.formData;
  let myPath = path.join(projectPath, params.username, params.projectCode, 'DataObject');
  if (fs.existsSync(myPath)) {
    fs.mkdir(path.join(myPath, formData.name), (err) => {
      if (err) {
        throw (err)
      } else {
        resJsonData(res,"创建文件夹成功", params)
      }
    })
  } else {
    res.json({
      success: false,
      message: params.projectCode + '目录异常!'
    });
  }
});

/*
* 添加控件
* @param localPath ‘control.json’本地保存路径
* @param formData json数据{"code": "ElDropdownMenu","name": "fcvcvc","icon": "cvcvcvc ","tpl": "cvcvcv"}
* */
router.post('/newControl', (req, res, next) => {
  let formData = req.body.formData,
      localPath =  req.body.localPath,
      jsonData = [];
  fs.existsSync(path.join(localPath, 'controls.json')) && (jsonData = JSON.parse(fs.readFileSync(path.join(localPath, 'controls.json'))))
  jsonData.push(formData);
  utils.writeFileTxt(path.join(localPath, 'controls.json'), JSON.stringify(jsonData,null,4),()=>{
    resJsonData(res,"添加控件成功")
  });
});

module.exports = router;
