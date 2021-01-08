/*
* 工具类
* */
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js');
const { create } = require('xmlbuilder2');
const { spawn } = require('child_process');

/**
 * * @caption 创建目录
 * * @param {String}  folderPath 例：'c:/x/y/z/'
 */
exports.mkdirsSync = (folderPath) => {
  let myfun = (folderPath) => {
    if (fs.existsSync(folderPath)) return true;
    if (myfun(path.dirname(folderPath))) {
      fs.mkdirSync(folderPath);
      return true;
    }
  }
  myfun(folderPath);
}

/*
* readFileTxt
* @parma filePath 要读取的文件路径
* @callback 回调
* */
exports.readFileTxt = (filePath, callback) => {
  try {
    fs.readFile(filePath, 'utf8', (err, txt) => {
      if (err) {
        throw (filePath + '文件或目录不存在！\n' + err);
      } else {
        callback && callback(txt);
      }
    });
  }
  catch (e) {
    console.log(e);
  }
};

/**
 * xml转json
 * @param {String}  xmlStr xml格式的字符串
 * @callback json将json结果传至callback
 */
exports.xml2json = (xmlStr, callback) => {
  let parser = new xml2js.Parser({explicitArray: false, mergeAttrs: true});
  xmlStr && parser.parseString(xmlStr, function (err, json) {
    if (err) {
      throw err
    } else {
      callback(json);
    }
  });
}

/**
 * json转xml
 * @param {Object}  json
 * @return xml格式字符串
 */
exports.json2xml = (json) => {
  if (json) {
    try {
      let DataObject = create({ 'version': '1.0', 'encoding': 'UTF-8', 'standalone': false }).ele('DataObject');
      let TableCollection = DataObject.ele('TableCollection')
      let Table = TableCollection.ele('Table')
      for (let key in json) {
        if (Object.prototype.toString.call(json[key]) == '[object Object]') {
          for (let tabKey in json[key].Table) {
            if (Array.isArray(json[key].Table[tabKey])) {
              json[key].Table[tabKey].forEach(element => {
                let Column = Table.ele('Column');
                element.Caption && Column.att('Caption', element.Caption)
                element.DataType && Column.att('DataType', element.DataType)
                element.Key && Column.att('Key', element.Key)
                element.DefaultValue && Column.att('DefaultValue', element.DefaultValue)
                element.Length && Column.att('Length', element.Length)
                return Column
              })
            } else {
              Table.att(tabKey, json[key].Table[tabKey])
            }
          }
        } else {
          DataObject.att(key, json[key])
        }
      }
      let xmlStr = DataObject.end({ prettyPrint: true });
      return xmlStr
    } catch (e) {
      throw e
    }
  }
}

/*
* readdirContent 读取目录下内容
* @parma dirPath 要读取的目录
* @callback 回调
* */
exports.readdirContent = (dirPath, callback) => {
  try {
    fs.readdir(dirPath,'utf-8',(err, files) => {
      if (err) {
        throw err;
      } else {
        callback && callback(files);
      }
    });
  }
  catch (e) {
    console.log(e);
  }
};

/*
* writeFileTxt
* @parma filePath 要写入的文件路径 data 文本字符串
* @callback 回调
* */
exports.writeFileTxt = (filePath, data, callback) => {
  try {
    fs.writeFile(filePath, data,'utf-8', (err, txt) => {
      if (err) {
        throw err;
      } else {
        callback && callback();
      }
    });
  }
  catch (e) {
    console.log(e);
  }
};

/*
* writeFileTxtSync 同步写入
* @parma filePath 要写入的文件路径 data 文本字符串
* @parma data 要写入的内容
* */
exports.writeFileTxtSync = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, data,'utf-8');
  }
  catch (e) {
    console.log(e);
  }
};

/*
* isDirectory 判断该路径是不是一个文件夹
* @parma filePath 要判断的文件路径
* @callback 回调 true || false 判断是不是文件夹
* */
exports.isDirectory = (fullPath, callback) => {
  let stat = fs.lstatSync(fullPath);
  let is_direc = stat.isDirectory();
  callback && callback(is_direc);
}

/*
* @caption 通过项目编码和技术栈搭建UI脚手架
* @param username 用户名 
* @param projectCode 项目代码 
* @param language 技术栈 例：initWebUI('test-ut', 'xyz', 'vue')
* @return username文件夹下，项目名为xyz的vue脚手架 默认vue
* */
exports.initWebUI = (username, projectCode, language) => {
  let result
  let projectUiPath = path.join(process.cwd(), 'userData', username, projectCode);
  switch (language.toLowerCase()) {
    case 'react':
      result = spawn('create-react-app ', ['ui'], { cwd: projectUiPath, shell: true, detached: true });
      break;
    case 'angular':
      result = spawn('ng new ', ['ui', '--defaults'], { cwd: projectUiPath, shell: true, detached: true });
      break;
    default:
      // 通过preset(-p)可将default自定义成预设(webUI)脚手架
      result = spawn('vue create ', ['ui', '-p', 'default'], { cwd: projectUiPath, shell: true, detached: true }); 
      break;
  }
  result.on('close', code => {
    console.log('webUI初始化进程退出码:' + code);
  });
  result.stdout.on('data', function (data) {
    console.log('stdout: ' + data + typeof (data));
  });
  result.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
}