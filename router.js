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
        '${obj["身份证号"]}', 
        '${obj["date"]}'
        );`
        code += str;
    }
    return code;
}

function isAccountExist(id, callback)
{
    const code = `SELECT * FROM [dbo].[Payslip_Users] WHERE ID='${id}'`;
    mssqlQuery(code, (isExist)=>{
        if(isExist.length){
            callback(true);
        }
        else{
            callback(false);
        }
    });
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
    isAccountExist(req.body.id, (exist)=>{
        if(exist == false)
            return res.send("id_error");
    });
    const code = `SELECT password FROM [dbo].[Payslip_Users] WHERE ID='${req.body.id}'`;
    try{
        mssqlQuery(code, (result)=>{
            try{
                if(result[0]!={}&&result!=[])    res.send(result[0].password);
                else    res.status(404).send(err.message);
            }catch(err)
            {
                console.log(err.message);
                res.status(404).send(err.message);
            }
        })
    } catch(err)
    {
        res.status(404).send(err.message);
    }
});

router.post("/resetPassword", (req, res)=>{
    isAccountExist(req.body.id, (exist)=>{
        if(exist == false)
            return res.send("id_error");
    });
    const code = `UPDATE [dbo].[Payslip_Users] SET password='${req.body.password}' WHERE ID='${req.body.id}'`;
    try{
        mssqlQuery(code, (result)=>{
            res.send("1");
        });
    }catch(err){
        console.log(err.message);
        res.status(404).send("0");
    }
});

router.post("/signUp", (req, res)=>{
    isAccountExist(req.body.id, (exist)=>{
        if(exist == true)
            return res.send("id_exist");
    });
    const exec = `INSERT INTO [dbo].[Payslip_Users] VALUES('${req.body.id}', '${req.body.name}', '${req.body.password}')`;
    try{
        mssqlQuery(exec, (result)=>{
            res.send("1");
        });
    }catch(err){
        console.log(err.message);
        res.status(404).send("0");
    }
});

router.get("/getPayslipList", (req, res)=>{
    const code = "SELECT DISTINCT [date] FROM [DES].[dbo].[Payslip_Wage]";
    try{
        mssqlQuery(code, (result)=>{
            res.send(result);
        });
    }catch(err){
        res.status(404).send(err.message);
    }
});

router.post("/payslip", (req, res)=>{
    const code = `SELECT * FROM [dbo].[Payslip_Wage] WHERE 身份证号='${req.body.id}' and date='${req.body.date}'`;
    try{
        mssqlQuery(code, (result)=>{
            if(result.length){delete result[0]["身份证号"];delete result[0]["date"];}
            res.send(result[0]);
        });
    }catch(err){
        console.log(err.message);
        res.status(404).json({error:err.message});
    }
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
        const date = req.body.date;
        const worksheet = workbook.Sheets[date];
        if(!worksheet){
            return res.status(400).json({ 
                success: false, 
                message: `工作表 "${date}" 不存在，请检查Excel文件` 
            });
        }
        
        // 将工作表转换为JSON
        let data = xlsx.utils.sheet_to_json(worksheet, {raw:false, defval: ""});
        for(let obj of data)    obj["date"] = date;
        const check = `SELECT * FROM [dbo].[Payslip_Wage] WHERE date='${date}'`;
        mssqlQuery(check, (isExist)=>{
            if(isExist.length){
                mssqlQuery(`DELETE FROM [dbo].[Payslip_Wage] WHERE date='${date}'`, ()=>{
                    mssqlQuery(multipleInsert(data), ()=>{
                        res.json({
                            success:true, 
                            message:"文件处理成功"
                        })
                    })
                });
            }
            else{
                mssqlQuery(multipleInsert(data), ()=>{
                    res.json({
                        success: true,
                        message: '文件处理成功'
                    });
                })
            }
        });
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