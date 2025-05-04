const express = require("express");
const xlsx = require("xlsx");
const multer = require("multer");
const sql = require("mssql");
const config = require("./config");
var router = express.Router();
const DIR = __dirname + "/ForeEnd/";

function mssqlQuery(code, callback)
{
    sql.connect(config, (err)=>{
        if(err)
        {
            console.log("Error: Failed to connect SQL Server");
            console.log(err);
            return;
        }
        else{
            var request = new sql.Request();
            request.query(code, (err, recordsets)=>{
                if(err)
                {
                    console.log("Error: Failed to query sql");
                    console.log(err);
                    return;
                }else{
                    var result = recordsets.recordset;
                    callback(result);
                }
            });
        }
        sql.end;
    });
}

function multipleInsert(data)
{
    let code = "";
    for(let obj of data)
    {
        let str = `INSERT INTO [dbo].[Payslip_Wage] VALUES (
        '${obj["NO."]}', 
        '${obj["时间"]}', 
        '${obj["部门"]}', 
        '${obj["班组"]}', 
        '${obj["工种"]}', 
        '${obj["工号"]}', 
        '${obj["姓名"]}', 
        '${obj["入厂日期"]}', 
        '${obj["基本工资"]}', 
        '${obj["工龄工资"]}', 
        '${obj["职务工资"]}', 
        '${obj["技能工资"]}', 
        '${obj["岗位补贴"]}', 
        '${obj["出勤时间"]}', 
        '${obj["出勤天数"]}', 
        '${obj["出勤工资"]}', 
        '${obj["绩效工资"]}', 
        '${obj["奖金"]}', 
        '${obj["小计"]}', 
        '${obj["-保险金"]}', 
        '${obj["-公积金"]}',
        '${obj["-所得税"]}',  
        '${obj["-其它"]}', 
        '${obj["-小计"]}', 
        '${obj["实发工资"]}', 
        '${obj["date"]}'
        );`
        code += str
    }
    return code;
}

const upload = multer({storage:multer.memoryStorage()});

router.get("/", (req, res)=>{
    res.setHeader("Content-Type", "text/html");
    res.sendFile(DIR + "login.html");
});

router.get("/upload", (req, res)=>{
    res.setHeader("Content-Type", "text/html");
    res.sendFile(DIR + "upload.html");
});

router.post("/login", (req, res)=>{
    const code = `SELECT password FROM [dbo].[Payslip_Users] WHERE 'EmpID'='${req.body.id}'`;
    mssqlQuery(code, (result)=>{
        res.send(result[0]);
    })
});

router.post("/wage", upload.single("file"), (req, res)=>{
    if (!req.file) {
        return res.status(400).json({ success: false, message: '没有上传文件' });
    }
    try {
        // 检查文件类型
        const fileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!fileTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的文件类型, 请上传Excel文件(.xlsx或.xls)' 
            });
        }
        
        // 读取Excel文件
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // 获取第一个工作表名
        const worksheet = workbook.Sheets[sheetName];
        
        // 将工作表转换为JSON
        const date = req.body.date;
        let data = xlsx.utils.sheet_to_json(worksheet, {raw:false, defval: ""});
        for(let obj of data)    obj["date"] = date;
        mssqlQuery(multipleInsert(data), (result)=>{
            console.log("上传成功");
            res.json({
                success: true,
                message: '文件处理成功'
            });
        })
        // 返回处理后的数据
    } catch (error) {
        console.error('处理Excel文件出错:', error);
        res.status(500).json({ 
            success: false, 
            message: '处理Excel文件出错',
            error: error.message 
        });
    }
});

module.exports = router;