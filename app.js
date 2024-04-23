require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const fileUpload = require("express-fileupload");
const csvtojson = require("csvtojson");

const axios = require('axios');
const bcrypt = require('bcrypt');
const app = express();
const router = require("./assets/js/route");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const requ = require("request").defaults({ rejectUnauthorized: false }); //for passing headers
const nodemailer = require("nodemailer");
const passport = require('passport');
const country = require("country-list-with-dial-code-and-flag");
const status = require("./assets/js/status");
const jwt = require("jsonwebtoken");
const cron = require('node-cron');
const path = require('path');
const cors = require('cors');

const fs = require("fs");
const cloudinary = require('cloudinary').v2;
const Razorpay = require("razorpay");
const crypto = require("crypto");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { Client, MessageMedia, NoAuth, Status } = require("whatsapp-web.js");
const DomainName = require('./assets/js/url');
let obj = [], apikey, userProfile;

const conn = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'qitsolution_swiftsend',
    // charset: 'utf8mb4'
})

// const conn = mysql.createConnection({
//     host: '164.52.208.110',
//     user: 'qitsolution_tempuser',
//     password: 'Qit123@#india',
//     database: 'qitsolution_swiftsend',
//     charset: 'utf8mb4'
// })

//Db itentifier: swift-send-db-itentifier
// username: admin
// const conn = mysql.createConnection({
//     host: process.env.HOST,
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: process.env.DATABASE,
// })

conn.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
})

cloudinary.config({
    cloud_name: "dx1ghhk7f",
    api_key: "653234377299131",
    api_secret: "z37qJcan_y9hvTHmdM2ffHrHHIo"
});

let instance = new Razorpay({
    key_id: "rzp_test_HTTzrcP3gKLLEv",
    key_secret: "CGgkDqWQn8f2Sp6vNwqftaXO",
});

app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(['/docs/assets', '/instance/assets', '/assets'], express.static("assets"));
app.use("/", router);
app.use(cors());

app.use(sessions({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

// const browser = puppeteer.launch({
//     executablePath: '/usr/bin/google-chrome-stable',
// });

const port = (process.argv[2]) ? process.argv[2] : 8081;
// const port = process.env.PORT || 80;
class clients {
    client;
    constructor() {
        // this.client = new Client();
        this.client = new Client({
            puppeteer: {
                args: ["--no-sandbox"], // Add the --no-sandbox flag here
            },
            webVersionCache: {
                type: "remote",
                remotePath:
                  "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
              },
        });
        this.client.initialize();
    }

    disconnect() {
        this.client.destroy();
        this.client.initialize();
        return Promise.resolve();
    }

    async generateqr() {
        try {
            const qrPromise = new Promise((resolve) => {
                this.client.on("qr", (qr) => {
                    resolve(qr);
                });
            });

            const qr = await qrPromise;
            return Promise.resolve(qr);
        } catch (error) {
            console.error("Error generating QR code:", error);
            return Promise.reject(error);
        }
    }

    async send_whatsapp_message(chatId, message) {
        await this.client.sendMessage(chatId, message).then((messageId) => {
            return Promise.resolve(messageId);
        }).catch((error) => {
            return Promise.reject(error);
        })
    };

    async send_whatsapp_document(chatId, media, caption) {
        await this.client.sendMessage(chatId, media, { caption: caption }).then((messageId) => {
            return Promise.resolve(messageId);
        }).catch((error) => {
            return Promise.reject(error);
        })
    }

    async checkAuth() {
        try {
            const authstatus = new Promise((resolve) => {
                this.client.on('ready', () => {
                    if (obj[iid].client.isLoggedIn()) {
                        resolve();
                    }
                    else {
                        reject();
                    }
                });
            });

            const auth = await authstatus;
            return Promise.resolve(auth);
        } catch (error) {
            console.error("Error generating QR code:", error);
            return Promise.reject(error);
        }
    }
}

async function checkAPIKey(apikey) {
    try {
        return await new Promise((resolve, reject) => {
            conn.query(`SELECT * FROM users WHERE apikey = '${apikey}'`, (error, results) => {
                if (error) return reject(status.internalservererror());
                if (results.length <= 0) resolve(false);
                resolve(true);
            });
        });
    }
    catch (e) {
        console.log(e);
    }
}

async function findData(apikey, column) {
    try {
        return await new Promise((resolve, reject) => {
            conn.query(`SELECT ${column} FROM users WHERE apikey = '${apikey}'`, (error, result) => {
                if (error || result.length <= 0) return reject(status.internalservererror().status_code);
                resolve(result[0][column]);
            });
        });
    }
    catch (e) {
        console.log(e);
    }
}

function setCookie(res, name, value, days) {
    res.cookie(name, value, { maxAge: 1000 * 60 * 60 * 24 * days });
}

function createfolder(foldername) {
    try {
        const dirs = foldername.split('/');
        let currentDir = '';

        for (const dir of dirs) {
            currentDir = path.join(currentDir, dir);

            if (!fs.existsSync(`${__dirname}/assets/upload/${currentDir}`)) {
                if (fs.mkdirSync(`${__dirname}/assets/upload/${currentDir}`)) {
                    status.ok().status_code;
                }
                else {
                    status.nodatafound().status_code;
                }
            }
            else {
                status.duplicateRecord().status_code;
            }
        }
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

function deleteFolder(folderPath) {
    try {
        if (fs.existsSync(`${__dirname}/assets/upload/${folderPath}`)) {
            fs.readdirSync(`${__dirname}/assets/upload/${folderPath}`).forEach((file) => {
                const currentPath = path.join(`${__dirname}/assets/upload/${folderPath}`, file);
                if (fs.lstatSync(currentPath).isDirectory()) {
                    // Recursively delete sub-folders and files
                    deleteFolder(currentPath);
                } else {
                    // Delete file
                    fs.unlinkSync(currentPath);
                }
            });
            // Delete the empty folder
            fs.rmdirSync(`${__dirname}/assets/upload/${folderPath}`);
            return true;
        } else {
            // Folder doesn't exist
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

const tableData = (data, callback) => {
    try {
        const sql = `SELECT * FROM ${data.table} WHERE ${data.paramstr} AND apikey = '${data.apikey}'`;
        // console.log(sql);
        conn.query(sql,
            (err, result) => {
                if (err) return callback(Object.assign(status.internalservererror(), { error: err }));
                // if (err) return callback(status.internalservererror());
                if (result.length == 0) return callback(status.nodatafound());
                return callback(result);
            });
    }
    catch (e) {
        console.log(e);
        callback(status.internalservererror());
    }
}

async function sendEmail(sender, contacts, subject, body, attachments = null) {
    let transporter = nodemailer.createTransport({
        host: sender.hostname,
        port: sender.port,
        secure: true,
        auth: {
            user: sender.email,
            pass: sender.passcode,
        },
    });
    console.log(sender.passcode);
    let mailOptions = {
        from: sender.email,
        to: contacts.to,
        bcc: contacts.bcc,
        subject: subject,
        html: body,
        attachments: attachments
    };

    return await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error) {
            if (error) return reject(error);
            return resolve();
        });
    });
}

const tableDataAdmin = (data, callback) => {
    try {
        if (data.table == "users") {
            conn.query(
                `SELECT apikey,uname,email,phone,phoneverify,country,state,city,registrationDate,image FROM users WHERE ${data.paramstr} LIMIT ${data.offset},${data.limit}`,
                (err, results) => {
                    if (err) return callback(status.internalservererror());
                    if (results.length == 0)
                        return callback(status.nodatafound());
                    return callback(results);
                }
            );
        } else {
            conn.query(
                `SELECT * FROM ${data.table} WHERE ${data.paramstr} LIMIT ${data.offset},${data.limit}`,
                (err, result) => {
                    if (err) return callback(status.internalservererror());
                    if (result.length == 0)
                        return callback(status.nodatafound());
                    return callback(result);
                }
            );
        }
    } catch (e) {
        console.log(e);
    }
};

async function AdmincheckAPIKey(apikey) {
    try {
        return await new Promise((resolve, reject) => {
            conn.query(`SELECT * FROM admin WHERE apikey = '${apikey}'`, (error, results) => {
                if (error) return reject(status.internalservererror());
                if (results.length <= 0) resolve(false);
                resolve(true);
            });
        });
    }
    catch (e) {
        console.log(e);
    }
}

function createInstance() {
    conn.query(`update instance set isActive = 0 where 1`, (err, result) => {
        if (err || result.affectedRows <= 0) return console.log(status.internalservererror());
        if (result <= 0) return console.log(status.nodatafound());
        conn.query(`update admin set isActive = 0 where 1`,
            (err, result) => {
                if (err || result.affectedRows < 1) console.log(status.internalservererror());
                if (result <= 0) return console.log(status.nodatafound());
            });
    });
}
createInstance();

const CREDENTIALS = JSON.parse(fs.readFileSync("spreadsheet-388213-84c50f351ad0.json"));

passport.use(new GoogleStrategy(
    {
        clientID: "552657255780-ud1996049ike2guu982i3ms5ver5gbsf.apps.googleusercontent.com",
        clientSecret: "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",
        // callbackURL: `http://localhost:8081/auth/google/callback`,
        callbackURL: `${(process.argv[2]) ? DomainName : `http://localhost:8081`}/auth/google/callback`,
    }, function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, userProfile);
    }
));

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signin" }),
    async function (req, res) {
        const apikey = crypto.randomBytes(16).toString("hex");
        var Ac_name = userProfile.displayName;
        var Ac_mail = userProfile.emails[0].value;
        var Ac_image = userProfile.photos[0].value;
        const URL = await cloudinary.uploader.upload(Ac_image, { folder: 'SS' });
        let profile;
        if (URL) {
            profile = URL.secure_url;
        }
        else {
            profile = "" || null;
        }
        conn.query(`select * from users where email = '${Ac_mail}'`,
            function (err, result) {
                if (err) return res.send(status.internalservererror());
                if (result.length > 0) {
                    setCookie(res, "apikey", result[0].apikey, 1);
                    res.redirect(`/dashboard`);
                }
                else {
                    conn.query(`INSERT INTO users (apikey,uname,email,password,phone,phoneverify,country,state,city,registrationDate,image) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, [apikey, Ac_name, Ac_mail, '', null, false, '', '', '', new Date(), profile],
                        function (err, result) {
                            if (err) return console.log(err);
                            if (result) {
                                setCookie(res, "apikey", apikey, 1);
                                res.redirect(`/dashboard`);
                            }
                        });
                }
            }
        );
    }
);

app.post("/sheetdata", async (req, res) => {
    var ssid = req.body.ssid;
    var sheetindex = req.body.sheetindex;

    const doc = new GoogleSpreadsheet(ssid);

    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key,
    });

    await doc.loadInfo();
    var phones = new Array();
    var data = new Array();
    var colnames = new Array();
    var object = new Object();
    let sheet = doc.sheetsByIndex[sheetindex];
    try {
        let rows = await sheet.getRows();
        colnames.push(rows[0]._sheet.headerValues);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            data.push(row._rawData);
            phones.push(row.phone);
        }
        object["colnames"] = colnames;
        object["values"] = data;
        res.send(object);
    }
    catch (e) {
        console.log(e);
        res.send(status.nodatafound());
    }
});

app.post("/file", async (req, res) => {
    try {
        if (req.files && req.files.csvfile.mimetype === 'text/csv') {
            let csvData = await req.files.csvfile.data.toString("utf8");
            return csvtojson().fromString(csvData).then((json) => {
                return res.json({
                    csv: csvData,
                    json: json
                });
            });
        }
        else {
            return res.send(status.notAccepted());
        }
    } catch (error) {
        console.log(error);
    }
});

/*----------------------------------------------------------*/

/*--------------------[ User | Support ]--------------------*/

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


// Bulkmessage : QRcode Generetor API
app.get("/qr/:iid", async (req, res) => {
    let iid = req.params.iid;
    try {
        obj[iid] = new clients();

        const qrData = await obj[iid].generateqr();

        if (qrData.length < 0) {
            console.log("No qr");
        }
        else {
            if (fs.existsSync(`${__dirname}/.wwebjs_cache`)) {
                fs.readdirSync(`${__dirname}/.wwebjs_cache`).forEach((file) => {
                    const currentPath = path.join(`${__dirname}/.wwebjs_cache/`, file);

                    fs.unlinkSync(currentPath);
                });
                fs.rmdirSync(`${__dirname}/.wwebjs_cache`);
            }
            // console.log(`${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} : ${qrData}`);
            return res.send(qrData);
        }
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

const delay = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

// Bulkmessage : Authentication Client API
app.get("/authenticated/:iid", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let iid = req.params.iid;

            await delay(10000);

            await obj[iid].client.on("authenticated", (session) => {

                conn.query(`update instance set isActive = 1 where instance_id = '${iid}'`,
                    (err, result) => {
                        if (err || result.affectedRows < 1) res.send(status.internalservererror());

                        res.send(status.ok());
                    });
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        //console.log(e);
        res.send(status.unauthorized());
    }
});

//Bulkmessage : Authentication Client API
app.get("/adminbotauthenticated/:iid", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await AdmincheckAPIKey(apikey);
    try {
        if (isValidapikey) {
            let iid = req.params.iid;

            obj[iid].client.on("authenticated", (session) => {
                conn.query(`update admin set isActive = 1 where apikey = '${iid}'`,
                    (err, result) => {
                        if (err || result.affectedRows < 1) res.send(status.internalservererror());

                        res.send(status.ok());
                    });
            });
        }
    }
    catch (e) {
        //console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Authentication Client API
app.get("/supportAuthenticated/:iid", async function (req, res) {
    try {
        let iid = req.params.iid;

        await obj[iid].client.on("authenticated", (session) => {
            res.send(status.ok());
        });

    }
    catch (e) {
        //console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Disconnected Client API
app.get("/disconnected/:iid", async (req, res) => {
    try {
        const iid = req.params.iid;
        obj[iid].disconnect().then(() => {
            conn.query(`update instance set isActive = 0 where instance_id = '${iid}'`,
                (err, result) => {
                    if (err || result.affectedRows < 1) res.send(status.internalservererror());
                    res.send(status.ok());
                });
        }).catch((error) => {
            console.error(`Error in dessconnecting: ${error}`);
            res.send(status.badRequest());
        });
    } catch (error) {
        console.log(error);
        res.send(status.forbidden());
    }
});

app.get("/supportDisconnected/:iid", async (req, res) => {
    try {
        const iid = req.params.iid;
        obj[iid].disconnect().then(() => {
            res.send(status.ok());
        }).catch((error) => {
            console.error(`Error in dessconnecting: ${error}`);
            res.send(status.badRequest());
        });
    } catch (error) {
        console.log(error);
        res.send(status.forbidden());
    }
});

app.get("/adminbotdisconnected/:iid", async (req, res) => {
    try {
        const iid = req.params.iid;
        obj[iid].disconnect().then(() => {
            conn.query(`update admin set isActive = 0 where apikey = '${iid}'`,
                (err, result) => {
                    if (err || result.affectedRows < 1) res.send(status.internalservererror());
                    res.send(status.ok());
                });
        }).catch((error) => {
            console.error(`Error in dissconnecting: ${error}`);
            res.send(status.badRequest());
        })
    } catch (error) {
        console.log(error);
        res.send(status.forbidden());
    }
});

app.get("/adminBotWork/:iid", (req, res) => {
    let iid = req.cookies.apikey;
    obj[iid].client.on('message', (message) => {

        let questions = [
            { question: '# Phone-number:', answer: '' },
            { question: '# Ticket subject:', answer: '' },
            { question: '# Registered Email:', answer: '' },
            {
                question: `# Write a name of your Ticket type:\n\t* Account Management\n\t* Technical Support\n\t* Payment Problem\n\t* Service Inquiry\n\t* Feedback and suggestions`, answer: ''
            },
            { question: `# Description:`, answer: '' }

        ];
        const answers = message.body.split('\n');
        if (answers.length > 1) {
            // Update the form questions with the user's answers
            questions.forEach((q, i) => {
                q.answer = answers[i];
            });
            const generateUniqueId = () => {
                const prefix = "W-";
                const maxLength = 6 - prefix.length;
                const maxNumber = Math.pow(10, maxLength) - 1;
                const uniqueId = Math.floor(Math.random() * maxNumber) + 1;
                return prefix + uniqueId.toString().padStart(maxLength, '0');
            };
            // Store the form data in a database
            const t_id = generateUniqueId();
            let phone = answers[0];
            let subject = answers[1];
            let Email = answers[2];
            let type = answers[3];
            let description = answers[4];

            let a_agents = new Array();
            let a_Account_Management = new Array();
            let a_Technical_Support = new Array();
            let a_Payment_Problem = new Array();
            let a_Service_Inquiry = new Array();
            let a_Feedback = new Array();

            conn.query(`select * from support_agents`, (err, result) => {
                if (err || result.length <= 0) res.send(status.internalservererror());
                if (result.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        a_agents.push(result[i].email);
                        if (result[i].category == "Account Management") {
                            a_Account_Management.push(result[i].email);
                        }
                        else if (result[i].category == "Technical Support") {
                            a_Technical_Support.push(result[i].email);
                        }
                        else if (result[i].category == "Payment Problem") {
                            a_Payment_Problem.push(result[i].email);
                        }
                        else if (result[i].category == "Service Inquiry") {
                            a_Service_Inquiry.push(result[i].email);
                        }
                        else if (result[i].category == "Feedback and Suggestions") {
                            a_Feedback.push(result[i].email);
                        }
                    }
                    let categories = {
                        "Account Management": a_Account_Management,
                        "Technical Support": a_Technical_Support,
                        "Payment Problem": a_Payment_Problem,
                        "Service Inquiry": a_Service_Inquiry,
                        "Feedback and Suggestions": a_Feedback,
                    };

                    const agentsInCategory = categories[type];
                    const Agent_email = agentsInCategory[Math.floor(Math.random() * agentsInCategory.length)];

                    conn.query("select * from users where email='" + Email + "'", (err1, res1) => {

                        if (err1) console.log(err1);
                        if (res1.length > 0) {
                            conn.query(`INSERT INTO support_ticket VALUES(?,?,?,?,?,?,?,?,?,?)`,
                                [t_id, 'whatsapp', phone, subject, type, description, 'open', new Date(), res1[0].apikey, Agent_email], (err, res2) => {
                                    if (err) console.log(err);
                                    if (res2.affectedRows == 1) {
                                        obj[iid].send_whatsapp_message(message.from, 'your support-ticket has been generated successfully!!!');
                                    }
                                })
                        }
                    })
                }
            })
        }
        else {
            switch (message.body) {
                case "hi":
                case "Hi": {
                    obj[iid].send_whatsapp_message(message.from, 'Hello! How can i help you??\nA. information \nB. query');
                    break;
                }
                case "A":
                    conn.query(`select description from bot where referencekey='A'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                let count = 1;
                                let msg = "*you have to write a number correspond to the problem which displaying in below message for the information.*\n";
                                for (let i = 0; i < results.length; i++) {
                                    msg += count + ". " + results[i].description + "\n";
                                    count++;
                                }
                                await obj[iid].send_whatsapp_message(message.from, msg);
                            }
                        })
                    break;
                case '1':
                    conn.query(`select description from bot where referencekey='1'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '2':
                    conn.query(`select description from bot where referencekey='2'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '3':
                    conn.query(`select description from bot where referencekey='3'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '4':
                    conn.query(`select description from bot where referencekey='4'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '5':
                    conn.query(`select description from bot where referencekey='5'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '6':
                    conn.query(`select description from bot where referencekey='6'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '7':
                    conn.query(`select description from bot where referencekey='7'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '8':
                    conn.query(`select description from bot where referencekey='8'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case '9':
                    conn.query(`select description from bot where referencekey='9'`,
                        async (error, results) => {
                            if (error) console.log(error);
                            if (results.length > 0) {
                                await obj[iid].send_whatsapp_message(message.from, results[0].description);
                            }
                        })
                    break;
                case "B":
                    obj[iid].send_whatsapp_message(message.from, 'Please fill out this ticket-details:\n\n*Note:You have to answer all the details in a single message and newline.*\n\n' + questions.map(q => q.question).join('\n'));
                    break;
            }
        }
    });
})

// Bulkmessage : Send Bulk Template Message API
app.post("/bulktemplatemessage", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.body.iid;
            const token = req.body.token;

            let matchingColumn = req.body.matchingColumn;
            let msg = req.body.message;
            let clientobj = req.body.clientobj;
            let selectedcol = req.body.selectedcol || [];
            console.log("selected col:", selectedcol);
            let msgarr;

            if (selectedcol.length == 1) {
                msgarr = one(msg, clientobj, selectedcol);
            }
            else if (selectedcol.length == 2) {
                msgarr = two(msg, clientobj, selectedcol);
            }
            else if (selectedcol.length == 3) {
                msgarr = three(msg, clientobj, selectedcol);
            }
            else if (selectedcol.length == 4) {
                msgarr = four(msg, clientobj, selectedcol);
            }
            else if (selectedcol.length == 5) {
                msgarr = five(msg, clientobj, selectedcol);
            }
            else {
                msgarr = msg;
            }

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());
                    for (let i = 0; i < clientobj.length; i++) {

                        if (obj[iid]) {
                            let chatId = `91${clientobj[i][matchingColumn]}@c.us`;

                            obj[iid].send_whatsapp_message(chatId, (selectedcol.length == 0) ? msgarr : msgarr[i]).then((messageId) => {
                                let msgid = crypto.randomBytes(8).toString("hex");

                                conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                    [msgid, (selectedcol.length == 0) ? msgarr : msgarr[i], 'Bulk Message Template', chatId, iid, apikey, token, new Date()],
                                    function (err, result) {
                                        if (err || result.affectedRows < 1) return status.internalservererror();
                                        if (i === clientobj.length - 1) {
                                            return res.send(status.ok());
                                        }
                                    });
                            }).catch((error) => {
                                console.log(`error in Sending schedule Message ::::::: <${error}>`);
                                return res.send(status.userNotValid());
                            })
                        }
                        else {
                            console.log("no iid found");
                            return res.send(status.userNotValid());
                        }
                    }
                });
        }
    }
    catch (e) {
        console.log(e);
        return res.send(status.unauthorized());
    }
});

// Bulkmessage : Send Document and Image API
app.post("/sendimage", async function (req, res) {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;

            const iid = req.body.iid;

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}'`,
                function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());

                    createfolder(`image_data/${apikey}/${iid}`);
                    if (req.files && Object.keys(req.files).length !== 0) {
                        const uploadedFile = req.files.image;
                        const uploadPath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;

                        uploadedFile.mv(uploadPath, async function (err) {
                            if (err) res.send(status.badRequest());
                            let filepath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;

                            const media = MessageMedia.fromFilePath(filepath);
                            const caption = req.body.caption;
                            if (obj[iid]) {
                                let phonearray = req.body.phonearray.split(",");
                                for (let i = 0; i < phonearray.length; i++) {
                                    let msgid = crypto.randomBytes(8).toString("hex");
                                    const chatId = `91${phonearray[i]}@c.us`;
                                    await obj[iid].send_whatsapp_document(chatId, media, caption).then((messageId) => {
                                        cloudinary.uploader.upload(filepath, { folder: 'SS' }).then((data) => {
                                            conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                                [msgid, data.secure_url, `Document-${req.files.image.mimetype}`, chatId, iid, apikey, token, new Date()],
                                                function (err, result) {
                                                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                    if (i == phonearray.length - 1) {
                                                        res.send(status.ok());
                                                        return;
                                                    }
                                                });
                                        }).catch((err) => {
                                            conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                                [msgid, uploadedFile.name, 'Document-' + req.files.image.mimetype, chatId, iid, apikey, token, new Date()],
                                                function (err, result) {
                                                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                    if (i == phonearray.length - 1) {
                                                        res.send(status.ok());
                                                        return;
                                                    }
                                                })
                                        });
                                    }).catch((error) => {
                                        console.error(`error in sending Document  to ${i + 1} row data ::::::: <${error}>`);
                                        res.send(status.userNotValid());
                                        return;
                                    });
                                }
                            }
                            else {
                                res.send(status.userNotValid());
                            }
                        });
                    }
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Send Message API
app.post("/sendmsg", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;
            const chatId = `91${req.body.to}@c.us`;
            const iid = req.body.iid;

            let message = req.body.message;

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}'`,
                async function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());
                    if (obj[iid]) {
                        obj[iid].send_whatsapp_message(chatId, message).then((messageId) => {
                            var msgid = crypto.randomBytes(8).toString("hex");
                            conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                [msgid, message, 'Single Message', chatId, iid, apikey, token, new Date()],
                                function (err, result) {
                                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                    res.send(status.ok());
                                });
                        }).catch((error) => {
                            console.log(`error in Sending Message ::::::: <${error}>`);
                            res.send(status.userNotValid());
                        })
                    }
                    else {
                        console.log("err1:", err);
                        res.send(status.userNotValid());
                    }
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Send Bulk Custom Message API
app.post("/bulkcustommessage", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;
            const iid = req.body.iid;

            let message = req.body.message;
            var contacts = req.body.contacts;

            let valid_contacts = contacts.filter(x => x.length == 10);
            let notInValidContact = contacts.filter(x => !valid_contacts.includes(x));


            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                async function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());
                    if (valid_contacts.length <= 0) return res.send(status.notAccepted())
                    for (let i = 0; i < valid_contacts.length; i++) {
                        const chatId = `91${valid_contacts[i]}@c.us`;
                        let msgid = crypto.randomBytes(8).toString("hex");
                        if (obj[iid]) {
                            obj[iid].send_whatsapp_message(chatId, message).then((messageId) => {
                                conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                    [msgid, message, 'Bulk Message custom', chatId, iid, apikey, token, new Date()],
                                    function (err, result) {
                                        if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                        if (i === valid_contacts.length - 1) return res.send(status.ok());
                                    });
                            }).catch((error) => {
                                console.log(`${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | error in Sending Bulk Message to Channel ::::::: `, error);
                                // console.log(`error in Sending Bulk Message to Channel ::::::: <${error}>`);
                                // return res.send(status.userNotValid());
                            })
                        }
                        else {
                            return res.send(status.userNotValid());
                        }
                    }
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Send Message through channel API
app.post("/sendmsgchannel", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;
            const iid = req.body.iid;

            let message = req.body.message;
            let contacts = req.body.contacts;

            let valid_contacts = contacts.filter(x => x.length == 10);
            let notInValidContact = contacts.filter(x => !valid_contacts.includes(x));

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`, async function (err, result) {
                if (err || result.length <= 0) return res.send(status.unauthorized());
                if (valid_contacts.length <= 0) return res.send(status.notAccepted())
                for (let i = 0; i < valid_contacts.length; i++) {
                    const chatId = `91${valid_contacts[i]}@c.us`;
                    let msgid = crypto.randomBytes(8).toString("hex");
                    if (obj[iid]) {
                        obj[iid].send_whatsapp_message(chatId, message).then((messageId) => {
                            conn.query(
                                `insert into message values(?,?,?,?,?,?,?,?)`,
                                [msgid, message, 'Bulk Message channel', chatId, iid, apikey, token, new Date()],
                                function (err, result) {
                                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                    if (i === valid_contacts.length - 1) return res.send(status.ok());
                                });
                        }).catch((error) => {
                            console.log(`${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | error in Sending Bulk Message to Channel ::::::: `, error);
                            // res.send(status.userNotValid());
                        })
                    }
                    else {
                        return res.send(status.userNotValid());
                    }
                }
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmessage : Send Message on Schedule API
app.post('/schedule', async (req, res) => {
    apikey = req.cookies.apikey;

    conn.query(`select * from company`,
        async function (err, result) {
            if (err || result.length <= 0) return res.send(status.internalservererror());
            if (result.length > 0) {
                const sender = {
                    "hostname": `${result[0].hostname}`,
                    "port": `${result[0].portnumber}`,
                    "email": `${result[0].c_email}`,
                    "passcode": `${result[0].passcode}`
                };
                const isValidapikey = await checkAPIKey(apikey);
                try {
                    if (isValidapikey) {
                        const iid = req.body.iid;
                        const token = req.body.token;
                        const time = req.body.time;
                        const schedule_id = `sh_${crypto.randomBytes(6).toString("hex")}`;
                        const to = await findData(apikey, 'email');
                        const subject = `Regarding your Schedule Message on SwiftSend`;

                        conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                            async function (err, result) {
                                if (err || result.length <= 0) return res.send(status.forbidden());
                                try {
                                    switch (req.body.type) {
                                        case 'message': {
                                            let message = req.body.message, contacts = req.body.contacts_list;
                                            let data = {
                                                "api": "/sendmsg",
                                                "body": message,
                                                "contacts": contacts
                                            };

                                            const task = cron.schedule(time, () => {
                                                if (obj[iid]) {
                                                    for (let i = 0; i < contacts.length; i++) {
                                                        const chatId = `91${contacts[i]}@c.us`;

                                                        obj[iid].send_whatsapp_message(chatId, message).then((messageId) => {
                                                            let msgid = crypto.randomBytes(8).toString("hex");

                                                            conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                                                [msgid, message, 'Schedule Single Message', chatId, iid, apikey, token, new Date()],
                                                                function (err, result) {
                                                                    if (err || result.affectedRows < 1) return status.internalservererror();
                                                                    if (i === contacts.length - 1) {
                                                                        conn.query(`update schedule set status = ? where schedule_id = ?`, [`DONE`, schedule_id],
                                                                            async function (err, result) {
                                                                                if (err || result.affectedRows < 1) return console.log(status.internalservererror());
                                                                                let body = "Your scheduled task has completed without any error.";
                                                                                sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                                    return console.log("Email Sent Scuuessfully");
                                                                                }).catch((error) => {
                                                                                    return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                                })
                                                                            });
                                                                    }
                                                                });
                                                        }).catch((error) => {
                                                            // console.log(`error in Sending schedule Message ::::::: <${error}>`);
                                                            conn.query(`update schedule set status = ? where schedule_id = ?`, [`ERROR`, schedule_id],
                                                                async function (err, result) {
                                                                    if (err || result.affectedRows < 1) return console.log(status.internalservererror());
                                                                    let body = `Your scheduled task has not completed due to : ${error}`;
                                                                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                        return console.log("Email Sent Scuuessfully");
                                                                    }).catch((error) => {
                                                                        return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                    })
                                                                });
                                                        })
                                                    }
                                                }
                                                else {
                                                    console.log("no iid found");
                                                    conn.query(`update schedule set status = ? where schedule_id = ?`, [`ERROR`, schedule_id],
                                                        function (err, result) {
                                                            if (err || result.affectedRows < 1) return console.log(status.internalservererror());
                                                            let body = `Your scheduled task has not completed due to : disconnected instance.`;
                                                            sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                return console.log("Email Sent Scuuessfully");
                                                            }).catch((error) => {
                                                                return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                            })
                                                        });
                                                }

                                            }, { scheduled: true, timezone: 'Asia/Kolkata' });
                                            task.start();
                                            conn.query(`insert into schedule values(?,?,?,?,?,?)`, [schedule_id, JSON.stringify(data), time, `PENDING`, apikey, iid],
                                                function (err, result) {
                                                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                    return res.send(status.ok());
                                                });
                                            break;
                                        }

                                        case 'document': {
                                            createfolder(`image_data/${apikey}/${iid}`);
                                            let contacts = null;
                                            if (typeof (req.body.contacts_list) === 'object') {
                                                contacts = req.body.contacts_list;
                                            }
                                            else if (typeof (req.body.contacts_list) === 'string') {
                                                contacts = req.body.contacts_list.split(',');
                                            }

                                            if (req.files && Object.keys(req.files).length !== 0) {
                                                const uploadedFile = req.files.image;
                                                const uploadPath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;

                                                uploadedFile.mv(uploadPath, async function (err) {
                                                    if (err) res.send(status.badRequest());
                                                    let filepath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;
                                                    const media = MessageMedia.fromFilePath(filepath);
                                                    let data = {
                                                        "api": "/sendmsg",
                                                        "body": media,
                                                        "contacts": contacts
                                                    };
                                                    const task = cron.schedule(time, async () => {
                                                        let filepath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;
                                                        const caption = req.body.caption;

                                                        if (obj[iid]) {
                                                            for (let i = 0; i < contacts.length; i++) {
                                                                const chatId = `91${contacts[i]}@c.us`;
                                                                await obj[iid].send_whatsapp_document(chatId, media, caption).then((messageId) => {
                                                                    var msgid = crypto.randomBytes(8).toString("hex");

                                                                    cloudinary.uploader.upload(filepath, { folder: 'M3' }).then((data) => {
                                                                        conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                                                            [msgid, data.secure_url, req.files.image.mimetype, chatId, iid, apikey, token, new Date()],
                                                                            function (err, result) {
                                                                                if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                                                if (i === contacts.length - 1) {
                                                                                    conn.query(`update schedule set status = ? where schedule_id = ?`, [`DONE`, schedule_id],
                                                                                        async function (err, result) {
                                                                                            if (err || result.affectedRows < 1) return console.log(status.internalservererror());

                                                                                            let body = "Your scheduled task has completed without any error.";

                                                                                            sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                                                return console.log("Email Sent Scuuessfully");
                                                                                            }).catch((error) => {
                                                                                                return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                                            })
                                                                                        });
                                                                                }
                                                                            });
                                                                    }).catch((err) => {
                                                                        console.log(`error in storing Document on cloudnary ::::::: <${err}>`);
                                                                        conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                                                            [msgid, uploadedFile.name, req.files.image.mimetype, chatId, iid, apikey, token, new Date()],
                                                                            function (err, result) {
                                                                                if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                                                if (i === contacts.length - 1) {
                                                                                    let body = "Your scheduled task has completed without any error.";

                                                                                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                                        console.log("Email Sent Scuuessfully");
                                                                                    }).catch((error) => {
                                                                                        console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                                    })
                                                                                }
                                                                            });
                                                                    });
                                                                }).catch((error) => {
                                                                    // console.error(`error in sending Document ::::::: <${error}>`);
                                                                    conn.query(`update schedule set status = ? where schedule_id = ?`, [`ERROR`, schedule_id],
                                                                        function (err, result) {
                                                                            if (err || result.affectedRows < 1) return console.log(status.internalservererror());
                                                                            let body = `Your scheduled task has not completed due to : ${error}`;
                                                                            sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                                return console.log("Email Sent Scuuessfully");
                                                                            }).catch((error) => {
                                                                                return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                            })
                                                                        });
                                                                });
                                                            }
                                                        }
                                                        else {
                                                            console.log("no iid found");
                                                            conn.query(`update schedule set status = ? where schedule_id = ?`, [`ERROR`, schedule_id],
                                                                function (err, result) {
                                                                    if (err || result.affectedRows < 1) return console.log(status.internalservererror());
                                                                    let body = `Your scheduled task has not completed due to : disconnected instance.`;
                                                                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                                                                        return console.log("Email Sent Scuuessfully");
                                                                    }).catch((error) => {
                                                                        return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                                    })
                                                                });
                                                        }

                                                    }, { scheduled: false, timezone: 'Asia/Kolkata' });
                                                    task.start();
                                                    conn.query(`insert into schedule values(?,?,?,?,?,?)`, [schedule_id, JSON.stringify(data), time, `PENDING`, apikey, iid],
                                                        function (err, result) {
                                                            if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                                                            return res.send(status.ok());
                                                        });
                                                });
                                            }
                                            break;
                                        }
                                    }
                                } catch (error) {
                                    console.log(`Failed to schedule message: ${error}`);
                                    return res.send(status.expectationFailed());
                                }
                            });
                    } else return res.send(status.unauthorized());
                }
                catch (e) {
                    console.log(e);
                    res.send(status.unauthorized());
                }
            }
        })
});
async function sendMessageToTeams(webhookUrl, message) {
    try {
        const payload = { text: message };

        const response = await axios.post(webhookUrl, payload);
        // console.log('Message sent to Microsoft Teams successfully');
        // console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('Error sending message to Microsoft Teams:', error.message);
        return false;
    }
}

app.post('/team', (req, res) => {

    let message = req.body.message;
    let webhookUrl = req.body.webhook;
    try {
        if (sendMessageToTeams(webhookUrl, message)) {
            res.send(status.ok());
        }
        else {
            res.send(status.expectationFailed());
        }
    }
    catch (err) {
        console.log(err);
        res.send(status.badRequest());
    }

})

// Bulkmessage : Refresh Token API
app.get("/refreshtoken/:iid", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let token = crypto.randomBytes(10).toString("hex");
            let iid = req.params.iid;
            conn.query(`UPDATE instance SET token = '${token}' where apikey = '${apikey}' and instance_id = '${iid}'`,
                function (err) {
                    if (err) console.log(err);
                    res.send(token);
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

app.get("/checkauth/:iid", (req, res) => {
    if (obj[req.params.iid]) {
        obj[req.params.iid].checkAuth().then(() => {
            console.log("Ready");
        }).catch(() => {
            console.log("Not Ready");
        })
    }
    else {
        console.log("iid not found");
    }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// Bulkmail : Send Bulk Template Mail API
app.post("/sendMail", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.body.iid;
            const token = req.body.token;
            const to = req.body.to;
            const from = await findData(apikey, 'email');
            const subject = req.body.subject;
            const body = req.body.body;

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                async function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());
                    const sender = {
                        "hostname": await findData(apikey, 'hostname'),
                        "port": await findData(apikey, 'port'),
                        "email": from,
                        "passcode": await findData(apikey, 'emailpasscode')
                    };

                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                        const id = crypto.randomBytes(8).toString("hex");
                        conn.query(`insert into email values(?,?,?,?,?,?,?,?,?)`,
                            [id, from, to, 'GMAIL', subject, body, iid, apikey, new Date()],
                            (err, result) => {
                                if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                                return res.send(status.ok());
                            });
                    }).catch((error) => {
                        // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        return res.send(status.badRequest());
                    })
                });
        }
    }
    catch (e) {
        console.log(e);
        return res.send(status.unauthorized());
    }
});

// Bulkmail : Send Bulk Template Mail API

// const MAX_RETRIES = 3; // Maximum number of retries
// const EMAILS_PER_BATCH = 10; // Number of emails to send per batch
// const DELAY_MS = 9000; // Delay in milliseconds between batches

// app.post("/bulktemplatemail", async function (req, res) {
//     try {
//         const apikey = req.cookies.apikey;
//         const isValidapikey = await checkAPIKey(apikey);
//         if (!isValidapikey) {
//             return res.send(status.forbidden());
//         }

//         const iid = req.body.iid;
//         const token = req.body.token;
//         const contacts = req.body.contacts;
//         const msg = req.body.message;
//         const clientobj = req.body.clientobj;
//         const selectedcol = req.body.selectedcol;
//         let msgarr;

//         switch (selectedcol.length) {
//             case 1:
//                 msgarr = one(msg, clientobj, selectedcol);
//                 break;
//             case 2:
//                 msgarr = two(msg, clientobj, selectedcol);
//                 break;
//             case 3:
//                 msgarr = three(msg, clientobj, selectedcol);
//                 break;
//             case 4:
//                 msgarr = four(msg, clientobj, selectedcol);
//                 break;
//             case 5:
//                 msgarr = five(msg, clientobj, selectedcol);
//                 break;
//         }

//         const result = await conn.query(
//             `SELECT * FROM instance WHERE instance_id = '${iid}' AND apikey = '${apikey}' AND token = '${token}'`
//         );
//         if (result.length <= 0) {
//             return res.send(status.forbidden());
//         }

//         const from = await findData(apikey, 'email');
//         const sender = {
//             hostname: await findData(apikey, 'hostname'),
//             port: await findData(apikey, 'port'),
//             email: from,
//             passcode: await findData(apikey, 'emailpasscode')
//         };

//         const sendEmailWithRetry = async (to, subject, body) => {
//             let retries = 0;
//             while (retries < MAX_RETRIES) {
//                 try {
//                     await sendEmail(sender, to, subject, body);
//                     return;
//                 } catch (error) {
//                     console.log(`Error in sending email to ${to}: ${error}`);
//                     retries++;
//                 }
//             }
//             throw new Error(`Failed to send email to ${to} after ${MAX_RETRIES} retries`);
//         };

//         const emailPromises = clientobj.map((_, i) => {
//             const to = contacts[i];
//             const subject = req.body.subject;
//             const body = msgarr[i];

//             const promise = sendEmailWithRetry(to, subject, body).then(() => {
//                 const id = crypto.randomBytes(8).toString("hex");
//                 return conn.query(
//                     `INSERT INTO email VALUES(?,?,?,?,?,?,?,?,?)`,
//                     [id, from, to, 'Bulk Mail Template', subject, body, iid, apikey, new Date()]
//                 );
//             });

//             // Introduce delay after every EMAILS_PER_BATCH emails
//             if ((i + 1) % EMAILS_PER_BATCH === 0) {
//                 return new Promise((resolve) => {
//                     setTimeout(() => {
//                         resolve(promise);
//                     }, DELAY_MS);
//                 });
//             }

//             return promise;
//         });

//         await Promise.all(emailPromises);
//         return res.send(status.ok());
//     } catch (e) {
//         console.log(e);
//         return res.send(status.unauthorized());
//     }
// });


app.post("/bulktemplatemail", async function (req, res) {

    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.body.iid;
            const token = req.body.token;

            let contacts = req.body.contacts;
            let msg = req.body.message;
            let clientobj = req.body.clientobj;
            let selectedcol = req.body.selectedcol;

            let msgarr;

            if (selectedcol.length == 1) {
                msgarr = one(msg, clientobj, selectedcol);
            } else if (selectedcol.length == 2) {
                msgarr = two(msg, clientobj, selectedcol);
            } else if (selectedcol.length == 3) {
                msgarr = three(msg, clientobj, selectedcol);
            } else if (selectedcol.length == 4) {
                msgarr = four(msg, clientobj, selectedcol);
            } else if (selectedcol.length == 5) {
                msgarr = five(msg, clientobj, selectedcol);
            }

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                async function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());

                    const from = await findData(apikey, 'email');
                    const subject = req.body.subject;
                    const sender = {
                        hostname: await findData(apikey, 'hostname'),
                        port: await findData(apikey, 'port'),
                        email: from,
                        passcode: await findData(apikey, 'emailpasscode')
                    };
                    for (let i = 0; i < clientobj.length; i++) {
                        const to = contacts[i];
                        const body = msgarr[i];

                        sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                            const id = crypto.randomBytes(8).toString("hex");
                            conn.query(`insert into email values(?,?,?,?,?,?,?,?,?)`,
                                [id, from, to, 'Bulk Mail Template', subject, body, iid, apikey, new Date()],
                                (err, result) => {
                                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                                    if (i === clientobj.length - 1) {
                                        return res.send(status.ok());
                                    }
                                });
                        }).catch((error) => {
                            // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                            return res.send(status.badRequest());
                        })
                    }
                });
        }
    }
    catch (e) {
        console.log(e);
        return res.send(status.unauthorized());
    }
});

// Bulkmail : Send Bulk Custom Mail API
app.post("/bulkcustommail", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;
            const iid = req.body.iid;

            const contacts = req.body.contacts;

            const contactObj = {
                to: '',
                bcc: contacts
            }

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`,
                async function (err, result) {
                    if (err || result.length <= 0) return res.send(status.forbidden());
                    const from = await findData(apikey, 'email');
                    const subject = req.body.subject;
                    const body = req.body.message;
                    const sender = {
                        "hostname": await findData(apikey, 'hostname'),
                        "port": await findData(apikey, 'port'),
                        "email": from,
                        "passcode": await findData(apikey, 'emailpasscode')
                    };

                    sendEmail(sender, contactObj, subject, body).then(() => {
                        contacts.map((value, key) => {
                            const id = crypto.randomBytes(8).toString("hex");
                            conn.query(`CALL insertEmailRecord (?,?,?,?,?,?,?,?,?)`,
                                [id, from, value, 'Bulk Mail Custom', subject, body, iid, apikey, new Date()],
                                function (err, result) {
                                    if (err) return console.log("err", err);
                                    if (key === contacts.length - 1) {
                                        return res.send(status.ok());
                                    }
                                });
                        })
                    }).catch((error) => {
                        // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        return res.send(status.badRequest());
                    })
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Bulkmail : Send Bulk Mail through channel API
app.post("/sendmailchannel", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const token = req.body.token;
            const iid = req.body.iid;

            let contacts = req.body.contacts;

            conn.query(`select * from instance where instance_id = '${iid}' and apikey = '${apikey}' and token = '${token}'`, async function (err, result) {
                if (err || result.length <= 0) return res.send(status.forbidden());
                const from = await findData(apikey, 'email');
                const subject = req.body.subject;
                const body = req.body.message;
                const sender = {
                    "hostname": await findData(apikey, 'hostname'),
                    "port": await findData(apikey, 'port'),
                    "email": from,
                    "passcode": await findData(apikey, 'emailpasscode')
                };
                for (let i = 0; i < contacts.length; i++) {
                    const to = contacts[i];
                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                        const id = crypto.randomBytes(8).toString("hex");
                        conn.query(`insert into email values(?,?,?,?,?,?,?,?,?)`,
                            [id, from, to, 'Bulk Mail Channel', subject, body, iid, apikey, new Date()],
                            (err, result) => {
                                if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                                if (i === contacts.length - 1) {
                                    return res.send(status.ok());
                                }
                            });
                    }).catch((error) => {
                        // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        return res.send(status.userNotValid());
                    })
                }
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


// Channel : add contact to channel
app.post("/addcontact2channel", async (req, res) => {
    var apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            var contacts = req.body.contacts;
            var query = `insert into contact_channel values `;
            for (let i in contacts) {
                if (i != contacts.length - 1) {
                    query += `('${req.body.id}','${contacts[i]}','${apikey}','${req.body.iid}'),`;
                }
                else {
                    query += `('${req.body.id}','${contacts[i]}','${apikey}','${req.body.iid}');`;
                }
            }
            conn.query(query, (err, result) => {
                if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                res.send(status.ok());
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Channel : get contact of particular channel
app.post("/get-channel-contact", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const channel_id = req.body.channel_id;
            conn.query(`SELECT cc.channel_id,c.contact_id,c.name,ch.channelName,c.phone,c.email,c.disable FROM contact_channel cc, contact c, channel ch WHERE cc.channel_id = ch.channel_id AND cc.contact_id = c.contact_id and cc.apikey = '${apikey}' AND cc.channel_id = '${channel_id}' AND cc.instance_id = '${req.body.iid}' order by c.name asc`,
                (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    if (result.length == 0) return res.send(status.nodatafound());
                    res.send(result);
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Channel : get contact of particular channel
app.post("/get-channel-active-contact", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const channel_id = req.body.channel_id;
            conn.query(`SELECT cc.channel_id,c.contact_id,c.name,ch.channelName,c.phone,c.email,c.disable FROM contact_channel cc, contact c, channel ch WHERE cc.channel_id = ch.channel_id AND cc.contact_id = c.contact_id and cc.apikey = '${apikey}' AND cc.channel_id = '${channel_id}' AND cc.instance_id = '${req.body.iid}'  AND c.disable = 0 order by c.name asc`,
                (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    if (result.length == 0) return res.send(status.nodatafound());
                    res.send(result);
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Channel : Create | Add Channel
app.post("/createchannel", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const id = crypto.randomBytes(8).toString("hex");
            conn.query(`insert into channel values('${id}','${req.body.name}','${apikey}','${req.body.iid}')`,
                (err, result) => {
                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                    res.send(status.created());
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


// Contact-list : add contact from sheet / csv
app.post("/importContactsFromGoogle", async (req, res) => {
    var apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);
    // const contentLength = req.headers['content-length'];
    // if (contentLength) {
    //     console.log('Payload size:', parseInt(contentLength), 'bytes');
    // }
    try {
        if (isValidapikey) {
            var clientarr = req.body.clients;
            var query = `insert into contact (contact_id,apikey,name,email,phone,instance_id) values`;
            for (var i in clientarr) {
                let id = crypto.randomBytes(8).toString("hex");
                if (i != clientarr.length - 1) {
                    query += `('${id}','${apikey}','${clientarr[i].name}','${clientarr[i].email}','${(clientarr[i].phone) ? clientarr[i].phone : 0}','${req.body.iid}'),`;
                }
                else {
                    query += `('${id}','${apikey}','${clientarr[i].name}','${clientarr[i].email}','${(clientarr[i].phone) ? clientarr[i].phone : 0}','${req.body.iid}')`;
                }
            }
            conn.query(query, (err, result) => {
                if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                res.send(status.ok());
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});


// Contact-list : Add contact
app.post("/addcontact", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let id = crypto.randomBytes(8).toString("hex");
            conn.query(
                `insert into contact (contact_id,apikey,name,email,phone,instance_id) values('${id}','${apikey}','${req.body.name}','${req.body.email}','${req.body.phone}','${req.body.iid}')`,
                (err, result) => {
                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                    res.send(status.ok());
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


// Instance : Create Instance
app.post("/addinstance", async (req, res) => {
    var token = crypto.randomBytes(10).toString("hex");
    var instanceid = crypto.randomBytes(8).toString("hex");
    var instance_name = req.body.instance_name;
    apikey = req.cookies.apikey;

    function create(id, name, apikey, token) {
        tableData({
            table: "instance",
            paramstr: `(i_name = '${name}')`,
            apikey: apikey,
        }, (result) => {
            if (result.status_code == 404) {
                conn.query(`INSERT INTO instance(instance_id,i_name,apikey,token,create_date,isActive) values('${id}','${name}','${apikey}','${token}',CURRENT_DATE,0)`,
                    function (error, result) {
                        if (error) return res.send(Object.assign(status.internalservererror(), { error: { detail: `Internal Server Error | Try again after some time` } }));

                        return res.send(Object.assign(status.created(), {
                            data: {
                                detail: `Instance Created Successfully`,
                                "Instance ID": id
                            }
                        }));
                    });
            }
            else {
                return res.send(Object.assign(status.duplicateRecord(), {
                    error: {
                        detail: `Instance with this name already exist`,
                    }
                }));
            }
        })
    }

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            tableData({
                table: "subscription",
                paramstr: true,
                apikey: apikey,
            }, (result) => {
                if (result.status_code == 404) {
                    tableData({
                        table: "instance",
                        paramstr: true,
                        apikey: apikey,
                    }, (result) => {
                        if (result.status_code == 404) {
                            create(instanceid, instance_name, apikey, token);
                        }
                        else {
                            return res.send(Object.assign(status.forbidden(), {
                                error: {
                                    detail: `Instance can't be created. Free instance can only be created once.`
                                }
                            }));
                        }
                    })
                }
                else {
                    var latest = new Date(result[0].pay_date), current_date = new Date();
                    var planID = result[0].planID;
                    let total_instance = 0, duration = 0, remaining_days = 0;
                    for (var i in result) {
                        if (latest < new Date(result[i].pay_date)) {
                            latest = new Date(result[i].pay_date);
                            planID = result[i].planID;
                        }
                    }

                    tableData({
                        table: "plans",
                        paramstr: `planid = ${planID} --`,
                        apikey: apikey,
                    }, (result) => {
                        total_instance = result[0].totalInstance;
                        duration = result[0].durationMonth;
                        latest.setMonth(latest.getMonth() + duration);
                        remaining_days = Math.ceil(Math.round(latest - current_date) / (1000 * 60 * 60 * 24));

                        // console.log(latest, total_instance);
                        if (remaining_days > 0) {
                            tableData({
                                table: "instance",
                                paramstr: true,
                                apikey: apikey
                            }, (result) => {
                                if (result.length >= total_instance) {
                                    return res.send(Object.assign(status.forbidden(), {
                                        error: {
                                            detail: `Max instance purchase limit exceeded. Upgrade plan..`
                                        }
                                    }));
                                }
                                create(instanceid, instance_name, apikey, token);
                            })
                        }
                        else {
                            return res.send(Object.assign(status.forbidden(), {
                                error: {
                                    detail: `Plan expired. Reactivate / Purchase new one`
                                }
                            }));
                        }
                    })
                }
            });
        }
        else {
            return res.send(Object.assign(status.unauthorized(), {
                error: {
                    detail: `Invalid API Key`
                }
            }));
        }
    } catch (error) {
        return res.send(Object.assign(status.unauthorized(), {
            error: {
                detail: error
            }
        }));
    }
});


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


// Custom-Templet : Create Custom Template
app.post("/create_custom_template", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let cstm_id = crypto.randomBytes(6).toString("hex");
            let cstm_name = req.body.name;
            let cstm_message = req.body.message;
            let field = req.body.field;
            // console.log(cstm_message);

            function char_count(cstm_message, letter) {
                var letter_Count = 0;
                for (var position = 0; position < cstm_message.length; position++) {
                    if (cstm_message.charAt(position) === letter) {
                        letter_Count += 1;
                    }
                }
                return letter_Count;
            }
            let tempmsg = cstm_message;
            let cnt = char_count(cstm_message, "{");
            for (let k = 1; k <= cnt; k++) {
                tempmsg = tempmsg.replace("{}", `[value${[k]}]`);
            }


            conn.query(`insert into cstm_template values(?,?,?,?,?)`,
                [cstm_id, cstm_name, tempmsg, field, apikey],
                (err, result) => {
                    if (err || result.affectedRows < 1) return res.send(status.internalservererror());
                    res.send(status.ok());
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});


/*----------------------------------------------------------*/

let otp, token;
app.post("/sendEmailVerification", (req, res) => {

    const to = req.body.email;
    if (to) {
        otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        token = jwt.sign({
            otp, exp: Math.floor(Date.now() / 1000) + 59
        }, "ourSecretKey");

        const subject = `Verification Email From SwiftSend | Communication Service`;
        const body = `<div class="u-row-container" style="padding: 0px;background-color: transparent"><div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;"><div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;"><div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;"><div style="height: 100%;width: 100% !important;"><table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:40px 40px 30px;font-family:'Lato',sans-serif;" align="left"><div style="line-height: 140%; text-align: left; word-wrap: break-word;"><p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px; color: #666666;">Hello,</span></p><p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px; color: #666666;">OTP to Verify your Email : </span><span style="font-size: 22px; color: #405189;">${otp}</span></p></div></td></tr></tbody></table>`

        conn.query(`select * from company`,
            function (err, result) {
                if (err || result.length <= 0) return res.send(status.internalservererror());
                if (result.length > 0) {
                    const sender = {
                        "hostname": `${result[0].hostname}`,
                        "port": `${result[0].portnumber}`,
                        "email": `${result[0].c_email}`,
                        "passcode": `${result[0].passcode}`
                    };
                    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                        return res.send(status.ok());
                    }).catch((error) => {
                        return res.send(status.badRequest());
                    })
                }
            })
    }
    else {
        return res.send(status.notAccepted());
    }
});

app.post("/verifyOTP", (req, res) => {
    const receivedOTP = req.body.otp;
    if (receivedOTP == otp) {
        jwt.verify(token, "ourSecretKey", function (err, decoded) {
            if (err) return res.send(status.forbidden());
            if (decoded) {
                res.cookie("everify", true);
                return res.send(status.ok());
            }
        });
    }
    else {
        return res.send(status.unauthorized());
    }
});

app.post("/adduser", (req, res) => {
    const id = crypto.randomBytes(16).toString("hex");

    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const password = req.body.password;
    const country = req.body.country;
    const state = req.body.state;
    const city = req.body.city;

    if (name && phone && email && password && country && state && name != undefined && phone != undefined && email != undefined && password != undefined && country != undefined && state != undefined) {
        conn.query("SELECT * FROM users WHERE email='" + email + "'",
            function (err, result) {
                if (err) return res.send(Object.assign(status.internalservererror(), { error: { detail: `Internal Server Error | Try again after some time` } }));

                if (result.length > 0) return res.send(Object.assign(status.duplicateRecord(), { error: { detail: `User with this Email Already exists` } }));

                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) return res.send(Object.assign(status.badRequest(), { error: { detail: `Error in Signup` } }));

                    conn.query(`INSERT INTO users (apikey,uname,email,password,phone,phoneverify,country,state,city,registrationDate,image) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, [id, name, email, hash, phone, false, country, state, city, new Date(), null],
                        function (err, result) {
                            res.clearCookie("everify");
                            if (err || result.affectedRows == 0) return res.send(Object.assign(status.internalservererror(), { error: { detail: `Internal Server Error | Try again after some time` } }));
                            return res.send(Object.assign(status.ok(), {
                                data: {
                                    detail: `User created Successfully with ${email} Email`,
                                    apikey: id
                                }
                            }));
                        });
                });
            });
    } else {
        return res.send(Object.assign(status.badRequest(), {
            error: {
                detail: `Invalid / Missing Parameter`
            }
        }));
    }
});


app.post("/signin", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const rememberme = req.body.rememberme;

    if (email && password && email != undefined && password != undefined && req.body.type && req.body.type != undefined) {

        tableData({
            table: req.body.type,
            paramstr: `email = '${email}' --`,
            apikey: apikey,
        }, (result) => {
            if (result.status_code == 500) {
                return res.send(Object.assign(status.internalservererror(), {
                    error: {
                        detail: `Internal Server Error | Try again after some time`
                    }
                }));
            }

            if (result.status_code == 404) {
                return res.send(Object.assign(status.unauthorized(), {
                    error: {
                        detail: `Invalid Email`
                    }
                }));
            }
            if (result.length > 1) {
                return res.send(Object.assign(status.duplicateRecord(), {
                    error: {
                        detail: `Multiple Email found`
                    }
                }));
            }
            bcrypt.compare(password, result[0].password, (err, match) => {
                if (match) {
                    setCookie(res, "apikey", result[0].apikey, 1);
                    if (rememberme == "true") {
                        res.cookie("email", email, { maxAge: 1000 * 60 * 60 * 24 * 15 });
                    }
                    return res.send(Object.assign(status.ok(), {
                        data: {
                            detail: `Login Successful`,
                            apikey: result[0].apikey
                        }
                    }));
                } else {
                    return res.send(Object.assign(status.unauthorized(), {
                        error: {
                            detail: `Invalid Password`
                        }
                    }));
                }
            });
        })
    }
    else {
        return res.send(Object.assign(status.badRequest(), {
            error: {
                detail: `Invalid / Missing Parameter`
            }
        }));
    }
});

app.post("/getUserMessages", async (req, res) => {
    let iid = req.body.iid;

    obj[iid].client.getChats().then((chats) => {
        for (const chat of chats) {
            if (chat.id._serialized === `91${req.body.phone}@c.us`) {
                chat.fetchMessages({ limit: 50 }).then((messages) => {
                    let usermessages = new Array();
                    for (let i = 0; i < messages.length; i++) {
                        if (messages[i].type == "chat") {
                            usermessages.push({
                                msg: messages[i].body,
                                fromMe: messages[i].fromMe,
                                timestamp: messages[i].timestamp,
                            });
                        }
                    }
                    res.send(usermessages);
                });
            }
        }
    }).catch((error) => {
        res.send(status.nodatafound());
    });
});

app.get('/message_summary', async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            conn.query(`SELECT m.instance_id AS iid, i.i_name AS i_name, 
            COUNT(CASE WHEN m.msg_type = 'Single Message' THEN 1 END) AS single_message_count, 
            COUNT(CASE WHEN m.msg_type like '%Document%' THEN 1 END) AS single_document_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Template' THEN 1 END) AS bulk_message_template_count,
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Custom' THEN 1 END) AS bulk_message_custom_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Channel' THEN 1 END) AS bulk_message_channel_count
            FROM message m JOIN instance i ON m.instance_id = i.instance_id GROUP BY m.apikey, m.instance_id, i.i_name having apikey = '${apikey}'`, function (err, result) {
                if (err) return res.send(status.internalservererror());
                if (result.length <= 0) return res.send(status.nodatafound());
                res.send(result);
            })
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.post('/message_filter', async (req, res) => {
    apikey = req.cookies.apikey;
    let start_date = req.body.startdate;
    let end_date = req.body.enddate;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            conn.query(`SELECT m.instance_id AS iid, i.i_name AS i_name, 
            COUNT(CASE WHEN m.msg_type = 'Single Message' THEN 1 END) AS single_message_count, 
            COUNT(CASE WHEN m.msg_type like '%Document%' THEN 1 END) AS single_document_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Template' THEN 1 END) AS bulk_message_template_count,
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Custom' THEN 1 END) AS bulk_message_custom_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Channel' THEN 1 END) AS bulk_message_channel_count
            FROM message m JOIN instance i ON m.instance_id = i.instance_id AND m.time BETWEEN '${start_date}' AND '${end_date}' GROUP BY m.apikey, m.instance_id, i.i_name having apikey = '${apikey}'`, function (err, result) {
                if (err) return res.send(status.internalservererror());
                if (result.length <= 0) return res.send(status.nodatafound());
                res.send(result);
            })
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.get('/message_summary_admin', async (req, res) => {
    conn.query(`SELECT COUNT(CASE WHEN m.msg_type = 'Single Message' THEN 1 END) AS single_message_count, 
            COUNT(CASE WHEN m.msg_type like '%Document%' THEN 1 END) AS single_document_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Template' THEN 1 END) AS bulk_message_template_count,
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Custom' THEN 1 END) AS bulk_message_custom_count, 
            COUNT(CASE WHEN m.msg_type = 'Bulk Message Channel' THEN 1 END) AS bulk_message_channel_count
            FROM message m`, function (err, result) {
        if (err) return res.send(status.internalservererror());
        if (result.length <= 0) return res.send(status.nodatafound());
        res.send(result);
    })
})

app.get('/email_summary', async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            conn.query(`SELECT m.instance_id AS iid, i.i_name AS i_name, 
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Template' THEN 1 END) AS bulk_mail_template_count,
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Custom' THEN 1 END) AS bulk_mail_custom_count, 
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Channel' THEN 1 END) AS bulk_mail_channel_count
            FROM email m JOIN instance i ON m.instance_id = i.instance_id GROUP BY m.apikey, m.instance_id, i.i_name having apikey = '${apikey}'`, function (err, result) {
                if (err) return res.send(status.internalservererror());
                if (result.length <= 0) return res.send(status.nodatafound());
                res.send(result);
            })
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.post('/email_filter', async (req, res) => {
    apikey = req.cookies.apikey;
    let start_date = req.body.startdate;
    let end_date = req.body.enddate;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            conn.query(`SELECT m.instance_id AS iid, i.i_name AS i_name, 
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Template' THEN 1 END) AS bulk_mail_template_count,
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Custom' THEN 1 END) AS bulk_mail_custom_count, 
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Channel' THEN 1 END) AS bulk_mail_channel_count
            FROM email m JOIN instance i ON m.instance_id = i.instance_id AND m.timestamp BETWEEN '${start_date}' AND '${end_date}' GROUP BY m.apikey, m.instance_id, i.i_name having apikey = '${apikey}'`, function (err, result) {
                if (err) return res.send(status.internalservererror());
                if (result.length <= 0) return res.send(status.nodatafound());
                res.send(result);
            })
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.get('/email_summary_admin', async (req, res) => {
    conn.query(`SELECT COUNT(CASE WHEN m.email_type = 'Bulk Mail Template' THEN 1 END) AS bulk_mail_template_count,
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Custom' THEN 1 END) AS bulk_mail_custom_count, 
            COUNT(CASE WHEN m.email_type = 'Bulk Mail Channel' THEN 1 END) AS bulk_mail_channel_count
            FROM email m`, function (err, result) {
        if (err) return res.send(status.internalservererror());
        if (result.length <= 0) return res.send(status.nodatafound());
        res.send(result);
    })
})

app.get("/get_phone_code", (req, res) => {
    var country_obj = country.getList();
    res.send(country_obj);
})

app.put("/updatepersonalinfo", async (req, res) => {
    apikey = req.cookies.apikey;

    let name = req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;
    let country = req.body.country;
    let state = req.body.state;
    let city = req.body.city;

    var sql = ``;
    const isValidapikey = await checkAPIKey(apikey);

    try {
        if (isValidapikey) {
            conn.query(`SELECT * FROM users WHERE apikey = '${apikey}'`,
                function (err, result) {
                    if (err) return res.send(status.internalservererror());
                    if (result <= 0) return res.send(status.nodatafound());
                    if (result[0].phone != phone) {
                        sql = `UPDATE users SET uname = '${name}', phone = '${phone}', email = '${email}', country = '${country}', state = '${state}', city = '${city}', phoneverify = false WHERE apikey = '${apikey}'`;
                    }
                    else {
                        sql = `UPDATE users SET uname = '${name}', phone = '${phone}', email = '${email}', country = '${country}', state = '${state}', city = '${city}' WHERE apikey = '${apikey}'`;
                    }
                    conn.query(sql, function (err, result) {
                        if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                        if (result <= 0) return res.send(status.nodatafound());
                        res.send(status.ok());
                    });
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.put("/phoneverify", async (req, res) => {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);

    try {
        if (isValidapikey) {
            conn.query(`UPDATE users SET phoneverify = true WHERE apikey = '${apikey}'`,
                function (err, result) {
                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                    if (result <= 0) return res.send(status.nodatafound());
                    res.send(status.ok());
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.post("/profile_img", async (req, res) => {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);

    try {
        if (isValidapikey) {
            createfolder(`/profile/${apikey}`);
            if (req.files && Object.keys(req.files).length !== 0) {
                const uploadedFile = req.files.img;
                const uploadPath = `${__dirname}/assets/upload/profile/${apikey}/${uploadedFile.name}`;

                uploadedFile.mv(uploadPath, function (err) {
                    if (err) return res.send(status.badRequest());
                    cloudinary.uploader.upload(uploadPath, { folder: 'SS' }).then((data) => {
                        conn.query(`UPDATE users SET image = '${data.secure_url}' WHERE apikey = '${apikey}'`,
                            function (err, result) {
                                if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                                deleteFolder(`/profile/${apikey}`);
                                res.send(status.ok());
                            });
                    }).catch((err) => {
                        console.log(`error in storing Document on cloudnary :::::::`, err);
                    });
                });
            }
            else return res.send(status.nodatafound());
        }
        else return res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
    }
})

app.get("/userinfo", async (req, res) => {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const data = {
                table: "users",
                paramstr: true,
                apikey: apikey
            }
            tableData(data, (result) => {

                res.send(result);
            });
        } else res.send(status.internalservererror().status_code);
    }
    catch (e) {
        console.log(e);
    }
});

app.get("/get-landingpage-data", (req, res) => {
    try {
        conn.query(`SELECT COUNT(*) AS total FROM users UNION ALL SELECT COUNT(*) FROM instance UNION ALL SELECT COUNT(*) FROM message UNION ALL SELECT COUNT(*) FROM email`,
            (err, result) => {
                if (err) return res.send(err);
                if (result.length > 0) {
                    res.send(result);
                }
            })
    }
    catch (e) {
        console.log(e);
    }
});

app.get("/getPlans", function (req, res) {
    const data = {
        table: "plans",
        paramstr: "true; --"
    }
    tableData(data, (result) => {
        res.send(result);
    });
});

app.get("/dis_template", function (req, res) {
    const data = {
        table: "template",
        paramstr: "true; --"
    }
    tableData(data, (result) => {
        res.send(result);
    });
});

app.get("/dis_user", function (req, res) {
    const data = {
        table: "users",
        paramstr: "true --",
    }
    tableData(data, (result) => {
        res.send(result);
    });
});

app.post("/dis_mes", function (req, res) {
    let temp_name = req.body.temp_name;
    tableData({
        table: "template",
        paramstr: `temp_name = '${temp_name}' --`,
        apikey: 'null'
    }, (result) => {
        switch (result.status_code) {
            case '500': {
                res.send(status.internalservererror());
                break;
            }
            case '404': {
                tableData({
                    table: "cstm_template",
                    paramstr: `cstm_name = '${temp_name}'`,
                    apikey: req.cookies.apikey
                }, (result) => {
                    res.send(result);
                })
                break;
            }
            default: {
                res.send(result);
                break;
            }
        }
    });
});

/*--------------------[ Common ]--------------------*/

// validate Instabce API
app.post("/validateInstance", (req, res) => {
    let iid = req.body.iid;
    let apikey = req.cookies.apikey;
    try {
        conn.query(`select * from instance where instance_id='${iid}'`,
            async (err, result) => {
                if (err) res.send(status.internalservererror());
                if (result.length == 1 && apikey == result[0].apikey) {
                    const isValidapikey = await checkAPIKey(result[0].apikey);
                    if (isValidapikey) {
                        tableData({
                            table: "subscription",
                            paramstr: true,
                            apikey: apikey,
                        }, (result) => {
                            if (result.status_code == 404) {
                                tableData({
                                    table: "instance",
                                    paramstr: true,
                                    apikey: apikey,
                                }, (result) => {
                                    if (result.status_code == 404) {
                                        res.send(status.ok());
                                    } else {
                                        res.send(status.forbidden());
                                    }
                                });
                            }
                            else {
                                var latest = new Date(result[0].pay_date),
                                    current_date = new Date();
                                var planID = result[0].planID;
                                let total_instance = 0,
                                    duration = 0,
                                    remaining_days = 0;
                                for (var i in result) {
                                    if (latest < new Date(result[i].pay_date)) {
                                        latest = new Date(result[i].pay_date);
                                        planID = result[i].planID;
                                    }
                                }

                                tableData({
                                    table: "plans",
                                    paramstr: `planid = ${planID} --`,
                                    apikey: apikey,
                                }, (result) => {
                                    total_instance = result[0].totalInstance;
                                    duration = result[0].durationMonth;
                                    latest.setMonth(latest.getMonth() + duration);
                                    remaining_days = Math.ceil(Math.round(latest - current_date) / (1000 * 60 * 60 * 24));

                                    if (remaining_days > 0) {
                                        tableData({
                                            table: "instance",
                                            paramstr: true,
                                            apikey: apikey,
                                        }, (result) => {
                                            if (result.length >= total_instance) return res.send(status.forbidden());
                                            res.send(status.ok());
                                        });
                                    }
                                    else {
                                        res.send(status.forbidden());
                                    }
                                });
                            }
                        });
                    } else res.send(status.unauthorized());
                } else {
                    res.send(status.badRequest());
                }
            });
    }
    catch (error) {
        console.log(error);
        res.send(status.unauthorized(), error);
    }
});

// Common DISPLAY API
app.post("/getData", async (req, res) => {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const data = {
                table: req.body.obj.table,
                paramstr: req.body.obj.paramstr,
                apikey: apikey
            }
            tableData(data, (result) => {
                res.send(result);
            });
        }
        else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Common UPDATE API
app.put("/updateData", (req, res) => {
    try {
        if (req.body.table == "users" && req.body.paramstr.includes("password")) {
            bcrypt.hash(req.body.paramstr.split('\'')[1], 10, (err, hash) => {
                if (err) return res.send("err in bcrypt");
                conn.query(`UPDATE ${req.body.table} SET password = '${hash}' WHERE ${req.body.condition}`,
                    (err, result) => {
                        if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                        if (result <= 0) return res.send(status.nodatafound());
                        res.send(status.ok());
                    })
            });
        }
        else {
            let sql = `UPDATE ${req.body.table} SET ${req.body.paramstr} WHERE ${req.body.condition}`;
            conn.query(sql,
                (err, result) => {
                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                    if (result <= 0) return res.send(status.nodatafound());
                    res.send(status.ok());
                })
        }
    }
    catch (e) {
        console.log(e);
    }
});

// Common DELETE API
app.delete("/deleterecord", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            conn.query(`DELETE FROM ${req.body.obj.table} WHERE ${req.body.obj.paramstr}`,
                (err, result) => {
                    if (err || result.affectedRows < 0) return res.send(status.internalservererror());
                    res.send(status.ok());
                });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
});

// Common instance wise page API
app.get("/instance/:id/:pagename", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const data = {
                table: 'instance',
                paramstr: `instance_id = '${req.params.id}'`,
                apikey: apikey
            }
            tableData(data, (result) => {
                switch (result.status_code) {
                    case '404': {
                        res.sendFile(`${__dirname}/pages/404.html`);
                        break;
                    }
                    case '500': {
                        res.send(status.internalservererror());
                        break;
                    }
                    default: {
                        res.sendFile(`${__dirname}/pages/user/${req.params.pagename}.html`);
                    }
                }
            });
        } else res.sendFile(`${__dirname}/pages/404.html`);
    }
    catch (e) {
        console.log(e);
        res.sendFile(`${__dirname}/pages/404.html`);
    }
})

app.post("/getDataWithCondition", (req, res) => {
    conn.query(`select * from ${req.body.table} where ${req.body.paramstr}`,
        (err, result) => {
            if (err) res.send(status.internalservererror());
            if (result.length > 0) {
                res.send(result);
            } else {
                res.send(status.nodatafound());
            }
        }
    );
});

/*--------------------[ Docs ]--------------------*/

// Docs : Send Message Testing API
app.post('/api/:iid/message', async (req, res) => {
    apikey = req.headers.apikey;
    const iid = req.params.iid;

    const chatId = `91${req.body.phone}@c.us`;
    const isValidapikey = await checkAPIKey(apikey);
    let requestBody = {};

    try {
        if (isValidapikey) {
            tableData({
                table: 'instance',
                paramstr: `instance_id = '${iid}'`,
                apikey: apikey
            }, (result) => {
                if (result.status_code == 500) return res.status(500).send(status.internalservererror());
                if (result.status_code == 404) {
                    return res.status(401).send(Object.assign(status.unauthorized(), {
                        error: { detail: `Invalid Instance ID` }
                    }));
                }
                if (result[0].disabled && result[0].disabled == '1') {
                    return res.status(403).send(Object.assign(status.forbidden(), {
                        error: { detail: `Instance Blocked` }
                    }));
                }
                if (result.length > 1) return res.status(409).send(status.duplicateRecord());
                if (obj[iid] && req.body.phone) {
                    requestBody.phone = req.body.phone;
                    if (req.body.type === 'message') {
                        const message = req.body.message;
                        requestBody["Message"] = message;
                        if (message && chatId) {
                            obj[iid].send_whatsapp_message(chatId, message).then((messageId) => {
                                var msgid = crypto.randomBytes(8).toString("hex");
                                conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                    [msgid, message, 'Test Single Message', chatId, iid, apikey, "none", new Date()],
                                    function (err, result) {
                                        if (err || result.affectedRows < 1) return res.status(500).send(status.internalservererror());
                                        logAPI("/message", apikey, iid, requestBody, "S");
                                        return res.status(200).send(Object.assign(status.ok(), {
                                            data: {
                                                detail: `Message sent to ${req.body.phone}`
                                            }
                                        }));
                                    });
                            }).catch((error) => {
                                logAPI("/message", apikey, iid, requestBody, "E");
                                return res.status(403).send(Object.assign(status.forbidden(), {
                                    error: {
                                        detail: "Error in sending message / Inactive instance"
                                    }
                                }));
                            })
                        }
                        else {
                            logAPI("/message", apikey, iid, requestBody, "E");
                            return res.status(404).send(Object.assign(status.badRequest(), {
                                error: {
                                    detail: "Receiver number or message is not defined in body"
                                }
                            }));
                        }
                    }
                    else if (req.body.type === 'document') {
                        createfolder(`image_data/${apikey}/${iid}`);
                        if (req.files.image && !Array.isArray(req.files.image)) {
                            if (req.files.image.size > 10000000) {
                                logAPI("/message", apikey, iid, requestBody, "E");

                                return res.status(406).send(Object.assign(status.notAccepted(), {
                                    error: {
                                        detail: `File Size are to large. Only Upto 10 MB are allowed.`
                                    }
                                }));
                            }

                            const uploadedFile = req.files.image;
                            requestBody["Document/Image"] = uploadedFile.name;
                            const uploadPath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;

                            uploadedFile.mv(uploadPath, async function (err) {
                                if (err) res.status(403).send(status.badRequest());
                                let filepath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${uploadedFile.name}`;

                                const media = MessageMedia.fromFilePath(filepath);
                                const caption = (req.body.caption) ? req.body.caption : null;
                                let msgid = crypto.randomBytes(8).toString("hex");

                                await obj[iid].send_whatsapp_document(chatId, media, caption).then((messageId) => {
                                    cloudinary.uploader.upload(filepath, { folder: 'SS' }).then((data) => {
                                        conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                            [msgid, data.secure_url, `Document-${req.files.image.mimetype}`, chatId, iid, apikey, "none", new Date()],
                                            function (err, result) {
                                                if (err || result.affectedRows < 1) {
                                                    logAPI("/message", apikey, iid, requestBody, "E");
                                                    return res.status(500).send(status.internalservererror());
                                                }
                                                logAPI("/message", apikey, iid, requestBody, "S");
                                                return res.status(200).send(Object.assign(status.ok(), {
                                                    data: {
                                                        detail: `Document sent to ${req.body.phone}`
                                                    }
                                                }));
                                            });
                                    }).catch((err) => {
                                        conn.query(`insert into message values(?,?,?,?,?,?,?,?)`,
                                            [msgid, uploadedFile.name, `Document-${req.files.image.mimetype}`, chatId, iid, apikey, "none", new Date()],
                                            function (err, result) {
                                                if (err || result.affectedRows < 1) {
                                                    logAPI("/message", apikey, iid, requestBody, "E");
                                                    return res.status(500).send(status.internalservererror());
                                                }
                                                else {
                                                    logAPI("/message", apikey, iid, requestBody, "S");
                                                    return res.status(200).send(Object.assign(status.ok(), {
                                                        data: {
                                                            detail: `Document sent to ${req.body.phone}`
                                                        }
                                                    }));
                                                }
                                            })
                                    }).finally(() => {
                                        deleteFolder(`/image_data/${apikey}/${iid}`);
                                    });
                                }).catch((error) => {
                                    // console.error(`error in sending Document ::::::: <${error}>`);
                                    logAPI("/message", apikey, iid, requestBody, "E");
                                    return res.status(403).send(Object.assign(status.forbidden(), {
                                        error: {
                                            detail: "Error in sending Doucment / Inactive instance"
                                        }
                                    }));
                                })
                            });
                        }
                        else {
                            logAPI("/message", apikey, iid, requestBody, "E");
                            return res.status(406).send(Object.assign(status.notAccepted(), {
                                error: {
                                    detail: "This API accepts only one file at a time. Please send only one file."
                                }
                            }));
                        }
                    }
                    else {
                        logAPI("/message", apikey, iid, requestBody, "E");
                        return res.status(404).send(Object.assign(status.badRequest(), {
                            error: {
                                detail: "Missing information in body (type* -> missing)"
                            }
                        }));
                    }
                }
                else {
                    requestBody = {
                        "phone": "",
                        "Message": "",
                        "Document/Image": ""
                    }
                    logAPI("/message", apikey, iid, requestBody, "E");

                    return res.status(403).send(Object.assign(status.forbidden(), {
                        error: {
                            detail: "Error in sending message / Inactive instance"
                        }
                    }));
                }
            });
        } else {
            logAPI("/message", apikey, iid, requestBody, "E");
            return res.status(401).send(Object.assign(status.unauthorized(), {
                error: {
                    detail: "Invalid API-KEY."
                }
            }));
        }
    }
    catch (e) {
        console.log(e);
        logAPI("/message", apikey, iid, requestBody, "E");
        return res.status(401).send(Object.assign(status.expectationFailed(), {
            error: {
                detail: "Invalid API-KEY | Issue in API"
            }
        }));
    }
});

async function getAttachmentObject(attachments, apikey, iid) {
    return new Promise((resolve, reject) => {
        try {
            let fileobj = new Array(), attachments_size = 0;
            createfolder(`image_data/${apikey}/${iid}`);
            Promise.all(
                attachments.map((value, key) => {
                    attachments_size += attachments[key].size;
                    const uploadPath = `${__dirname}/assets/upload/image_data/${apikey}/${iid}/${attachments[key].name}`;

                    return new Promise((resolveMv, rejectMv) => {
                        attachments[key].mv(uploadPath, function (err) {
                            if (err) {
                                rejectMv(err);
                            }
                            else {
                                fileobj.push({ path: uploadPath });
                                resolveMv();
                            }
                        });
                    });
                })
            ).then(() => {
                resolve({ fileobj, attachments_size });
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Docs : Send Message Testing API
app.post('/api/:iid/email', async (req, res) => {
    apikey = req.headers.apikey;
    let requestBody;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.params.iid;

            tableData({
                table: 'instance',
                paramstr: `instance_id = '${iid}'`,
                apikey: apikey
            }, async (result) => {
                console.log("result : ", result);
                console.log("AAA : ", result[0].disabled);
                if (result.status_code == 500) return res.status(500).send(status.internalservererror());
                if (result.status_code == 404 || result.length > 1) {
                    return res.status(401).send(Object.assign(status.unauthorized(), {
                        error: { detail: `Invalid Instance ID` }
                    }));
                }
                if (result[0].disabled && result[0].disabled == '1') {
                    return res.status(403).send(Object.assign(status.forbidden(), {
                        error: { detail: `Instance Blocked` }
                    }));
                }


                const to = req.body.to;
                const subject = req.body.subject;
                const body = req.body.body;
                const sender = {
                    "hostname": await findData(apikey, 'hostname'),
                    "port": await findData(apikey, 'port'),
                    "email": await findData(apikey, 'email'),
                    "passcode": await findData(apikey, 'emailpasscode')
                };
                const attachments = (req.files) ? Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments] : [];
                requestBody = {
                    "To": to || "",
                    "Subject": subject || "",
                    "body": body || "",
                }
                getAttachmentObject(attachments, apikey, iid)
                    .then(({ fileobj, attachments_size }) => {
                        if (attachments_size <= 10000000) {
                            sendEmail(sender, { to: to, bcc: "" }, subject, body, fileobj).then(() => {
                                logAPI("/email", apikey, iid, requestBody, "S");
                                return res.status(200).send(Object.assign(status.ok(), {
                                    data: {
                                        detail: `Email Sent to ${to}`
                                    }
                                }));
                            }).catch((error) => {
                                logAPI("/email", apikey, iid, requestBody, "E");
                                return res.status(404).send(Object.assign(status.notAccepted(), {
                                    error: {
                                        detail: `Error in sending Email / insufficient data in body object.`,
                                        errorData: error
                                    }
                                }));
                            }).finally(() => {
                                deleteFolder(`/image_data/${apikey}/${iid}`);
                            })
                        }
                        else {
                            logAPI("/email", apikey, iid, requestBody, "E");
                            return res.status(406).send(Object.assign(status.notAccepted(), {
                                error: {
                                    detail: `Total file size exceeds the limit (10 MB)`
                                }
                            }));
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            });

        } else {
            logAPI("/email", apikey, iid, requestBody, "E");
            return res.status(401).send(Object.assign(status.unauthorized(), {
                error: {
                    detail: "Invalid API-KEY."
                }
            }));
        }
    }
    catch (e) {
        console.log(e);
        logAPI("/email", apikey, iid, requestBody, "E");
        return res.status(401).send(Object.assign(status.expectationFailed(), {
            error: {
                detail: "Invalid API-KEY | Issue in API"
            }
        }));
    }
});

// Docs : GET Testing API
app.get('/api/:iid/:fld', async (req, res) => {
    apikey = req.headers.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            tableData({
                table: 'instance',
                paramstr: `instance_id = '${req.params.iid}'`,
                apikey: apikey
            }, (result) => {
                if (result.status_code == 500) return res.status(500).send(status.internalservererror());
                if (result.status_code == 404) {
                    return res.status(401).send(Object.assign(status.unauthorized(), {
                        error: { detail: `Invalid Instance ID` }
                    }));
                }
                if (result.length > 1) return res.status(409).send(status.duplicateRecord());
                tableData({
                    table: `${req.params.fld}`,
                    paramstr: `instance_id = '${req.params.iid}'`,
                    apikey: apikey
                }, (result) => {
                    if (result.status_code == 500) return res.status(500).send(status.internalservererror());
                    if (result.status_code == 404) return res.status(404).send(status.nodatafound());
                    res.send(result);
                });
            });
        }
        else {
            return res.status(401).send(Object.assign(status.unauthorized(), {
                error: {
                    detail: "Invalid API-KEY."
                }
            }));
        }
    }
    catch (e) {
        console.log(e);
        return res.status(401).send(Object.assign(status.expectationFailed(), {
            error: {
                detail: "Invalid API-KEY | Issue in API"
            }
        }));
    }
});

// Docs : POST Testing API
app.post('/api/:iid/:fld', async (req, res) => {
    apikey = req.headers.apikey;
    const iid = req.params.iid;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            tableData({
                table: 'instance',
                paramstr: `instance_id = '${iid}'`,
                apikey: apikey
            }, (result) => {
                if (result.status_code == 500) return res.send(status.internalservererror());
                if (result.status_code == 404) {
                    return res.status(401).send(Object.assign(status.unauthorized(), {
                        error: { detail: `Invalid Instance ID` }
                    }));
                }
                if (result.length > 1) return res.send(status.duplicateRecord());
                let ID = crypto.randomBytes(8).toString("hex");

                let keys = Object.keys(req.body);
                let value = Object.values(req.body);

                let query = `insert into ${req.params.fld} (`;
                for (var i in keys) {
                    query += `${keys[i]}, `;
                }
                query += `${req.params.fld}_id,apikey, instance_id) values (`;
                for (var i in value) {
                    query += `${value[i]}, `;
                }
                query += `'${ID}','${apikey}','${iid}')`;
                conn.query(query, (err, result) => {
                    if (err || result.affectedRows <= 0) return res.send(status.internalservererror());
                    res.send(status.created());
                });
            });
        }
        else {
            return res.status(401).send(Object.assign(status.unauthorized(), {
                error: {
                    detail: "Invalid API-KEY."
                }
            }));
        }
    }
    catch (e) {
        console.log(e);
        return res.status(401).send(Object.assign(status.expectationFailed(), {
            error: {
                detail: "Invalid API-KEY | Issue in API"
            }
        }));
    }
});

//log DISPLAY
app.get("/user/api/log/:iid", (req, res) => {
    apikey = req.headers.apikey || req.cookies.apikey;
    const isValidapikey = checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let iid = req.params.iid;

            var query = `select * from log where apikey='${apikey}'and instance_id='${iid}'`;

            if (req.query.type && req.query.type != "null") {
                query += ` AND type = '${req.query.type}'`;
            }

            if (req.query.api && req.query.api != "null") {
                query += ` AND api = '/${req.query.api}'`;
            }

            query += `ORDER BY logtime DESC`;

            conn.query(query,
                function (err, ret) {
                    if (err || ret.length < 0) return res.send(status.nodatafound());
                    res.send(ret);
                }
            )
        }
    } catch {
        res.status(404).send({
            "Error Code": "404",
            "Message": "Apikey is Invalid"
        });
    }
});

// Docs : DELETE Testing API
app.delete('/api/:iid/:fld', async (req, res) => {
    apikey = req.headers.apikey;
    const iid = req.params.iid;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            tableData({
                table: 'instance',
                paramstr: `instance_id = '${iid}'`,
                apikey: apikey
            }, (result) => {
                if (result.status_code == 500) return res.send(status.internalservererror());
                if (result.status_code == 404) {
                    return res.status(401).send(Object.assign(status.unauthorized(), {
                        error: { detail: `Invalid Instance ID` }
                    }));
                }
                if (result.length > 1) return res.send(status.duplicateRecord());

                let query = `delete from ${req.params.fld} where ${Object.keys(req.body)[0]} = ${Object.values(req.body)[0]}`;
                conn.query(query, (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    if (result.affectedRows <= 0) return res.send({ "status_code": "404", "Message": "Invalid Contact ID" });
                    return res.status(200).send(Object.assign(status.ok(), {
                        error: {
                            detail: "Item Deleted Successfully."
                        }
                    }));
                });
            });
        }
        else {
            return res.status(401).send(Object.assign(status.unauthorized(), {
                error: {
                    detail: "Invalid API-KEY."
                }
            }));
        }
    }
    catch (e) {
        console.log(e);
        return res.status(401).send(Object.assign(status.expectationFailed(), {
            error: {
                detail: "Invalid API-KEY | Issue in API"
            }
        }));
    }
});

/*------------------------------------------------*/

/*--------------------[ Workflow ]--------------------*/

app.post("/createWorkflow", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            let wid = crypto.randomBytes(16).toString("hex");
            let wname = req.body.wname;
            let iid = req.body.iid;
            conn.query(`insert into workflow values(?,?,?,?,?,?,?)`, [wid, wname, '', 0, '', apikey, iid],
                (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    if (result.affectedRows == 1) {
                        res.send(status.ok());
                    } else {
                        res.send(status.internalservererror());
                    }
                }
            );
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
    }


});

app.post("/insertWorkflowApi", (req, res) => {
    let wfid = req.body.wfid;
    let wfname = req.body.wfname;
    let api_name = req.body.api_name;
    let index_no = req.body.index_no;
    let body_data = req.body.body_data;
    let apikey = req.body.apikey;
    let instance_id = req.body.instance_id;

    conn.query(`insert into workflow values('${wfid}','${wfname}','${api_name}',${index_no},'${body_data}','${apikey}','${instance_id}')`,
        (err, result) => {
            if (err) return res.send(status.internalservererror());
            if (result.affectedRows == 1) {
                res.send(status.ok());
            } else {
                res.send(status.internalservererror());
            }
        }
    );
});

app.put("/updateWorkflowSteps", (req, res) => {
    conn.query("select * from workflow where workflow_id='" + req.body.workflow_id + "'", (err, result) => {
        if (err) return res.send(status.internalservererror());
        if (result.length > 0) {
            let flag = true;
            // for (let i = req.body.index_start; i < result.length; i++) { 
            conn.query(`update workflow set index_no=index_no-1 where workflow_id='${req.body.workflow_id}' and index_no>=${req.body.index_start}`, (err, rslt) => {
                if (err) res.send(status.internalservererror());
                if (rslt.affectedRows == 0) {
                    res.send(status.internalservererror());
                } else {
                    res.send(status.ok());
                }
            })
        } else {
            res.send(status.badRequest());
        }
    })
})

/*----------------------------------------------------*/

app.post('/user', async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const data = {
                table: 'instance',
                paramstr: `instance_id = '${req.body.iid}'`,
                apikey: apikey
            }
            tableData(data, (result) => {
                res.send(result);
            });
        } else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
    }
})

app.post("/resetpasswordmail", async (req, res) => {
    const email = req.body.email;
    const domain = (process.argv[3]) ? process.argv[3] : `localhost:8081`
    const subject = `Reset password from SwiftSend | Communication Service`;
    const body = `<div class="u-row-container" style="padding: 0px;background-color: transparent"><div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;"><div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;"><div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;"><div style="height: 100%;width: 100% !important;"><table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:40px 40px 30px;font-family:'Lato',sans-serif;" align="left"><div style="line-height: 140%; text-align: left; word-wrap: break-word;"><p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px; color: #666666;">Hello,</span></p><p style="font-size: 14px; line-height: 140%;">&nbsp;</p><p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px; color: #666666;">We have sent you this email in response to your request to reset your password on company name.</span></p><p style="font-size: 14px; line-height: 140%;">&nbsp;</p><p style="font-size: 14px; line-height: 140%;"><span style="font-size: 18px; line-height: 25.2px; color: #666666;">To reset your password, please follow the link below:</span></p></div></td></tr></tbody></table><table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:0px 40px;font-family:'Lato',sans-serif;" align="left"><div align="left"><a href="${domain}/password-change" target="_blank" class="v-button" style="box-sizing: border-box;display: inline-block;font-family:'Lato',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #18163a; border-radius: 1px;-webkit-border-radius: 1px; -moz-border-radius: 1px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;font-size: 14px;"><span style="display:block;padding:15px 40px;line-height:120%;"><span style="font-size: 18px; line-height: 21.6px;">Reset Password</span></span></a></div></td></tr></tbody></table>
            <table style="font-family:'Lato',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="overflow-wrap:break-word;word-break:break-word;padding:40px 40px 30px;font-family:'Lato',sans-serif;" align="left"></td></tr></tbody></table></div></div></div></div></div>`;
    if (email) {
        const data = {
            table: 'users',
            paramstr: `email = '${email}' --`,
            apikey: 'null'
        }
        tableData(data, async (result) => {
            console.log(result);
            let flag = false;
            for (let i in result) {
                if (email == result[i].email) {
                    flag = true;
                    break;
                }
                else {
                    flag = false;
                }
            }
            console.log("flag :", flag);
            if (!flag) return res.send(status.nodatafound());
            conn.query(`select * from company`,
                function (err, result) {
                    if (err || result.length <= 0) return res.send(status.internalservererror());
                    if (result.length > 0) {
                        const sender = {
                            "hostname": `${result[0].hostname}`,
                            "port": `${result[0].portnumber}`,
                            "email": `${result[0].c_email}`,
                            "passcode": `${result[0].passcode}`
                        };
                        console.log("A");
                        // sendEmail(sender, { to: email, bcc: "" }, subject, body).then(() => {
                        //     return res.send(status.ok());
                        // }).catch((error) => {
                        //     // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        //     return res.send(status.badRequest());
                        // })
                    }
                })
        });
    }
});

app.post("/create/orderId", (req, res) => {
    let amount = req.body.amount;
    var options = {
        amount: amount,
        currency: "INR",
        receipt: "order_rcptid_i5",
    };
    instance.orders.create(options, function (err, order) {
        res.send({ orderId: order.id });
    });
});

app.post("/api/payment/verify", (req, res) => {
    let body = `${req.body.response.razorpay_order_id}|${req.body.response.razorpay_payment_id}`;

    var expectedSignature = crypto
        .createHmac("sha256", "CGgkDqWQn8f2Sp6vNwqftaXO")
        .update(body.toString())
        .digest("hex");
    var response = { signatureIsValid: "false" };
    if (expectedSignature === req.body.response.razorpay_signature) {
        response = { signatureIsValid: "true" };
    }
    res.send(response);
});

app.post("/recordPayment", function (req, res) {
    let subID = crypto.randomBytes(10).toString("hex");
    let planID = req.body.planID;
    let amount = req.body.amount / 100;
    let apikey = req.body.apikey;
    let payID = req.body.payID;
    let orderId = req.body.orderID;

    conn.query(`insert into subscription values('${subID}','${planID}',${amount},'${apikey}','${payID}','${orderId}',CURRENT_DATE)`,
        (err, result) => {
            if (err) return res.send(status.internalservererror());
            res.send(status.ok());
        });
});

app.post("/checkoldpwd", async function (req, res) {
    apikey = req.cookies.apikey;
    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            tableData({
                "table": "users",
                "paramstr": true,
                "apikey": apikey
            }, (result) => {
                bcrypt.compare(req.body.oldpwd, result[0].password, (err, match) => {
                    if (match) {
                        return res.send(status.ok());
                    } else {
                        return res.send(status.notAccepted());
                    }
                });
            });
        }
        else res.send(status.unauthorized());
    }
    catch (e) {
        console.log(e);
        res.send(status.unauthorized());
    }
})

app.post("/updatePasscode", (req, res) => {
    let query = ``;
    if (req.body.emailtype == "gmail") {
        query = "update users set emailpasscode='" + passcode + "' where apikey='" + req.cookies.apikey + "'";
    } else {
        query = `update users set emailpasscode='
      ${passcode}',hostname='${req.body.hostname}',port=${req.body.port} where apikey='${req.cookies.apikey}'`;
    }
    conn.query(query, (err, result) => {
        if (err) return res.send(status.internalservererror());
        if (result.affectedRows == 1) {
            res.send(status.ok());
        } else {
            res.send(status.internalservererror());
        }
    });
});

// admin apis->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post("/getDataByPage", (req, res) => {
    var limit = req.body.limit;
    var offset = (req.body.pgno - 1) * limit;
    var table = req.body.table;

    if (table == "users") {
        conn.query(
            `SELECT apikey,uname,email,phone,phoneverify,country,state,city,registrationDate,image FROM users LIMIT ${offset},${limit};`,
            (err, results) => {
                //console.log(results);
                res.send(results);
            }
        );
    } else {
        conn.query(
            `SELECT * FROM ${table} LIMIT ${offset},${limit};`,
            (err, results) => {
                res.send(results);
            }
        );
    }
});

app.post("/getBtn", (req, res) => {
    var limit = req.body.limit;
    var table = req.body.table;
    var offset = (req.body.pgno - 1) * limit;
    conn.query(
        `SELECT count(*) as cnt FROM ${table} WHERE ${req.body.paramstr}`,
        (err, results) => {
            var totalBtn = results[0].cnt / limit;
            res.send({ totalBtn: Math.ceil(totalBtn) });
        }
    );
});

app.post("/adminSearchRecord", async (req, res) => {
    let limit = req.body.limit;
    try {
        const data = {
            table: req.body.table,
            paramstr: req.body.paramstr,
            limit: limit,
            offset: (req.body.pgno - 1) * limit,
        };
        tableDataAdmin(data, (result) => {
            res.send(result);
        });
    } catch (e) {
        //console.log(e);
    }
});

app.post("/addRecord", function (req, res) {
    let table = req.body.table;
    if (table == "company") {
        const id = crypto.randomBytes(8).toString("hex");
        console.log(id);
        console.log("c_name:", req.body.c_name);
        console.log("c_email:", req.body.c_email);
        console.log("host:", req.body.hostname);
        console.log("portnumber:", req.body.portnumber);
        console.log("passcode:", req.body.passcode);
        conn.query(
            `insert into company(company_id,c_name,c_email,hostname,portnumber,passcode) values('${id}','${req.body.c_name}','${req.body.c_email}','${req.body.hostname}',${req.body.portnumber},'${req.body.passcode}')`,
            (err, result) => {
                console.log("Result:", result);
                if (err) return res.send(status.internalservererror());
                if (result.affectedRows == 1) {
                    res.send(status.ok());
                } else {
                    res.send(status.internalservererror());
                }
            }
        );
    }
    else if (table == "plans") {
        conn.query(
            `insert into plans(pname,price,durationMonth,totalInstance,totalMessage,discount,plan_type) values('${req.body.pname}',${req.body.price},${req.body.duration},${req.body.instances},${req.body.messages},${req.body.discount},'${req.body.type}')`,
            (err, result) => {
                if (err) return res.send(status.internalservererror());
                if (result.affectedRows == 1) {
                    res.send(status.ok());
                } else {
                    res.send(status.internalservererror());
                }
            }
        );
    }
    else if (table == "template") {
        conn.query(
            `insert into template(temp_name,temp_message,userfields) values('${req.body.tname}','${req.body.message}',${req.body.userfields})`,
            (err, result) => {
                if (err) return res.send(status.internalservererror());
                if (result.affectedRows == 1) {
                    res.send(status.ok());
                } else {
                    res.send(status.internalservererror());
                }
            }
        );
    }
    else if (table == "support_agents") {
        const id = crypto.randomBytes(8).toString("hex");
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) return res.send("err in bcrypt");
            conn.query(`insert into support_agents values(?,?,?,?,?)`,
                [id, req.body.aname, req.body.email, hash, req.body.category],
                (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    if (result.affectedRows == 1) {
                        res.send(status.ok());
                    } else {
                        res.send(status.internalservererror());
                    }
                }
            );
        });

    }
});

app.post("/adminDeleteRecord", (req, res) => {
    conn.query(
        `delete from ${req.body.table} where ${req.body.column}='${req.body.id}'`,
        (err, result) => {
            if (err) return res.send(status.internalservererror());
            if (result.affectedRows == 1) {
                res.send(status.ok());
            } else {
                res.send(status.expectationFailed());
            }
        }
    );
});

app.get("/adminbotauthenticated/:iid", async function (req, res) {
    apikey = req.cookies.apikey;

    const isValidapikey = await AdmincheckAPIKey(apikey);
    try {
        if (isValidapikey) {
            let iid = req.params.iid;
            obj[iid].client.on("authenticated", (session) => {
                conn.query(`update admin set isActive = 1 where apikey = '${iid}'`,
                    (err, result) => {
                        if (err || result.affectedRows < 1) res.send(status.internalservererror());

                        res.send(status.ok());
                    });
            });
        }

    }
    catch (e) {
        //console.log(e);
        res.send(status.unauthorized());
    }
});

app.get("/adminbotdisconnected/:iid", async (req, res) => {
    try {
        const iid = req.params.iid;
        obj[iid].disconnect().then(() => {
            conn.query(`update admin set isActive = 0 where apikey = '${iid}'`,
                (err, result) => {
                    if (err || result.affectedRows < 1) res.send(status.internalservererror());
                    res.send(status.ok());
                });
        }).catch((error) => {
            console.error(`Error in dissconnecting: ${error}`);
            res.send(status.badRequest());
        })
    } catch (error) {
        console.log(error);
        res.send(status.forbidden());
    }
});

app.get("/chartsupportticket", (req, res) => {
    (AM_count = 0), (TS_count = 0), (PP_count = 0), (SI_count = 0), (F_count = 0);
    conn.query(
        "SELECT t_type,ticket_id FROM support_ticket",
        (err, result) => {
            if (err) return console.log(err);
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].t_type == "Account Management") {
                        AM_count++;
                    } else if (result[i].t_type == "Technical Support") {
                        TS_count++;
                    } else if (result[i].t_type == "Payment Problem") {
                        PP_count++;
                    } else if (result[i].t_type == "Service Inquiry") {
                        SI_count++;
                    } else if (result[i].t_type == "Feedback and Suggestions") {
                        F_count++;
                    }
                }
                var obj = { AM: AM_count, TS: TS_count, PP: PP_count, SI: SI_count, F: F_count };
                res.send(obj);
            }
        }
    );
});

app.get("/chartemail", (req, res) => {
    (template_bulk = 0), (custom_bulk = 0), (channel_bulk = 0);
    conn.query(
        "SELECT email_type,email_id FROM email",
        (err, result) => {
            if (err) return console.log(err);
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].email_type == "Template Bulk Mail") {
                        template_bulk++;
                    } else if (result[i].email_type == "Custom Bulk Mail") {
                        custom_bulk++;
                    } else if (result[i].email_type == "Channel Bulk Mail") {
                        channel_bulk++;
                    }
                }
                var obj = { templateBulk: template_bulk, customBulk: custom_bulk, channelBulk: channel_bulk };
                res.send(obj);
            }
        }
    );
});

// ----------------------------------------------------------

app.post("/card", function (req, res) {
    var table = req.body.table;
    var paramstr = req.body.paramstr;
    conn.query(`select count(*) as cnt from ${table} where ${paramstr}`, (err, result) => {
        if (err) return res.send(err);
        if (result.length > 0) {
            res.send(result);
        }
    });
});

app.post("/distinct", function (req, res) {
    var column = req.body.column;
    var table = req.body.table;
    conn.query(`select country, count(apikey) as cnt from ${table} group by country`, (err, result) => {
        if (err) return res.send(err);
        if (result.length > 0) {
            res.send(result);
        }
    });
});

app.post("/monthlyreport", function (req, res) {
    let month = req.body.month;
    let year = req.body.year;
    conn.query(`SELECT count(*) as cnt FROM users WHERE MONTH(registrationDate) = ${month} AND YEAR(registrationDate)=${year}`, (err, result) => {
        if (err) return res.send(err);
        if (result.length > 0) {
            res.send(result);
        }
    });
});

app.post("/instancereport", function (req, res) {
    let month = req.body.month;
    let year = req.body.year;
    conn.query(`SELECT count(*) as cnt FROM instance WHERE MONTH(create_date) = ${month} AND YEAR(create_date)=${year}`, (err, result) => {
        if (err) return res.send(err);
        if (result.length > 0) {
            res.send(result);
        }
    });
});

//user wise plan subscription
app.get("/usersubscription", (req, res) => {
    conn.query(
        "SELECT planID,count(*) as cnt from subscription GROUP BY planID",
        (err, result) => {
            if (err) return res.send(err);
            if (result.length > 0) {
                res.send(result);
            }
        })
})

//attachment handle function support-ticket
async function getSupportTicketAttachmentObj(attachments, apikey) {
    return new Promise((resolve, reject) => {
        try {
            let fileobj = new Array(), attachments_size = 0;
            createfolder(`support-ticket_doc_data/${apikey}`);
            Promise.all(
                attachments.map((value, key) => {
                    attachments_size += attachments[key].size;
                    const uploadPath = `${__dirname}/assets/upload/support-ticket_doc_data/${apikey}/${attachments[key].name}`;

                    return new Promise((resolveMv, rejectMv) => {
                        attachments[key].mv(uploadPath, function (err) {
                            if (err) {
                                rejectMv(err);
                            }
                            else {
                                fileobj.push({ path: uploadPath });
                                resolveMv();
                            }
                        });
                    });
                })
            ).then(() => {
                resolve({ fileobj, attachments_size });
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

app.post("/addticket", async (req, res) => {
    let apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.body.iid;
            const generateUniqueId = () => {
                const prefix = "ST-";
                const maxLength = 7 - prefix.length;
                const maxNumber = Math.pow(10, maxLength) - 1;
                const uniqueId = Math.floor(Math.random() * maxNumber) + 1;
                return prefix + uniqueId.toString().padStart(maxLength, '0');
            };
            const t_id = generateUniqueId();

            let email = await findData(apikey, 'email');
            let subject = req.body.subject;
            let t_type = req.body.t_type;
            let description = req.body.description;
            let attachments = (req.files) ? Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments] : [];

            let agents = new Array();
            let Account_Management = new Array();
            let Technical_Support = new Array();
            let Payment_Problem = new Array();
            let Service_Inquiry = new Array();
            let Feedback = new Array();

            conn.query(`select * from support_agents`, (err, result) => {
                if (err || result.length <= 0) res.send(status.internalservererror());
                for (let i = 0; i < result.length; i++) {
                    agents.push(result[i].email);
                    if (result[i].category == "Account Management") {
                        Account_Management.push(result[i].email);
                    } else if (result[i].category == "Technical Support") {
                        Technical_Support.push(result[i].email);
                    } else if (result[i].category == "Payment Problem") {
                        Payment_Problem.push(result[i].email);
                    }
                    else if (result[i].category == "Service Inquiry") {
                        Service_Inquiry.push(result[i].email);
                    }
                    else if (result[i].category == "Feedback and Suggestions") {
                        Feedback.push(result[i].email);
                    }
                }
                let categories = {
                    "Account Management": Account_Management,
                    "Technical Support": Technical_Support,
                    "Payment Problem": Payment_Problem,
                    "Service Inquiry": Service_Inquiry,
                    "Feedback and Suggestions": Feedback,
                };
                const agentsInCategory = categories[t_type];
                const assignedAgent = agentsInCategory[Math.floor(Math.random() * agentsInCategory.length)];

                getSupportTicketAttachmentObj(attachments, apikey)
                    .then(({ fileobj, attachments_size }) => {

                        conn.query(`INSERT INTO support_ticket VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
                            [t_id, `email`, email, subject, t_type, description, '', `open`, new Date(), apikey, assignedAgent],
                            async (err, resp) => {
                                if (err) return res.send(status.internalservererror());
                                //mail to support person for support ticket assigning
                                conn.query(`select * from company`,
                                    function (err, result) {
                                        if (err || result.length <= 0) return res.send(status.internalservererror());
                                        if (result.length > 0) {

                                            const sender = {
                                                "hostname": `${result[0].hostname}`,
                                                "port": `${result[0].portnumber}`,
                                                "email": `${result[0].c_email}`,
                                                "passcode": `${result[0].passcode}`
                                            };

                                            const agent_body = `<body style="background-color: #f4f4f4;">
                                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                            <p style="color: #555; font-size: 16px; line-height: 1.5;">Dear ${assignedAgent},</p>
                                            <p style="color: #555; font-size: 14px; line-height: 1.5;">A new ticket has been assigned to you. Here are the details:</p>
                                            <ul style="margin: 10px 0; padding: 0; list-style: none;">
                                            <li style="margin-bottom: 5px;">
                                            <strong style="color: #333;">Ticket ID : ${t_id}</strong> 
                                            </li>
                                            </ul>
                                            <p style="color: #555; font-size: 14px; line-height: 1.5;">Please login to  review the ticket and take necessary action accordingly.</p>
                                            <p style="color: #555; font-size: 14px; line-height: 1.5;">Thank you for your attention.</p>
                                            <p style="margin-top: 20px; font-size: 16px; color: #777;">Sincerely,<br>
                                            <b>SwiftSend</b>
                                            </div>
                                            </body>`;

                                            const user_body = `<body>
                                            <p>Dear Customer,</p>
                                            <p>Thank you for reaching out to us. We have received your ticket and it is currently being reviewed by our support team. Here are the details:</p>
                                            <ul style="margin: 10px 0; padding: 0; list-style: none;">
                                            <li style="margin-bottom: 5px;">
                                            <strong style="color: #333;">Ticket ID : ${t_id}</strong> 
                                            </li>
                                            </ul>
                                            <p>We understand the importance of your inquiry and will make every effort to provide you with a timely response. Please note that our support team may require additional information or clarification to assist you further. We kindly request your patience during this process.</p>
                                            <p>Thank you for choosing our services. We appreciate your patience and look forward to resolving your issue.</p>
                                            <p>Sincerely,</p>
                                            <b>SwiftSend Support Team</b>
                                            </body>`;

                                            if (attachments_size <= 10000000) {
                                                sendEmail(sender, { to: assignedAgent, bcc: "" }, `New Ticket assigned`, agent_body, fileobj).then(() => {
                                                    sendEmail(sender, { to: email, bcc: "" }, `Ticket Acknowledgement | SwiftSend`, user_body).then(() => {
                                                        return res.send(status.ok());
                                                    }).catch((error) => {
                                                        // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                        return res.send(status.badRequest());
                                                    })
                                                }).catch((error) => {
                                                    // console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                                                    return res.send(status.badRequest());
                                                }).finally(() => {
                                                    deleteFolder(`/support-ticket_doc_data/${apikey}`);
                                                })
                                            }
                                            else {
                                                console.log("Total file size exceeds the limit (10 MB)");
                                                logAPI("/email", apikey, iid, requestBody, "E");
                                                return res.status(401).send({ code: "401", message: "Total file size exceeds the limit (10 MB)" });
                                            }
                                        }
                                    })
                            })
                    })
            })

        } else res.send(status.unauthorized());
    } catch (e) {
        //console.log(e);
        res.send(status.unauthorized());
    }
});

app.post("/getTickets", (req, res) => {
    try {
        const data = {
            table: req.body.obj.table,
            paramstr: req.body.obj.paramstr,
        };
        tableData(data, (result) => {
            res.send(result);
        });
    } catch (e) {
        console.log(e);
    }
});

app.post("/AgentReplyToTicket", async (req, res) => {
    let agent_id = req.cookies.apikey;
    let id = req.body.id;
    let indexno = req.body.indexno;
    let identity = req.body.identity;
    let category = req.body.category;
    let description = req.body.description;
    let uname = req.body.uname;
    let contact = req.body.contact;
    let response = req.body.response;
    const chatId = `91${contact}@c.us`;

    conn.query(`select * from company`,
        async function (err, result) {
            if (err || result.length <= 0) return res.send(status.internalservererror());
            if (result.length > 0) {

                const sender = {
                    "hostname": `${result[0].hostname}`,
                    "port": `${result[0].portnumber}`,
                    "email": `${result[0].c_email}`,
                    "passcode": `${result[0].passcode}`
                };

                const to = req.body.email;
                const subject = `Reply of your Ticket ${id}`;
                const body = `<div>
                    <b>Hello ${uname}</b><br>
                    Your Query : #${id} ${subject}<br>
                    ${description}<br>
                    Answer: <b>${response}</b>
                </div>`;

                switch (category) {
                    case 'whatsapp': {
                        await obj[agent_id].send_whatsapp_message(chatId, `Hello ${uname}\n\nFor query #${id} \n\nWe have considered your query and send response on your email: ${to}\n\nPlease check your email or login to SwiftSend to view the reply`);
                        sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                            conn.query(`INSERT INTO ticket_reply VALUES (?,?,?,?,?,?)`,
                                [indexno, identity, id, response, new Date(), agent_id], (err, result) => {
                                    if (err) return res.send(status.internalservererror());
                                    conn.query(`update support_ticket set status='inprogress' where ticket_id='${id}'`, (err2, result2) => {
                                        if (err2 || result2.affectedRows <= 0) return res.send(status.internalservererror());
                                        res.send(status.ok());
                                    });
                                });
                        }).catch((error) => {
                            return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        })
                        break;
                    }

                    case 'email': {
                        sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
                            conn.query(`INSERT INTO ticket_reply VALUES (?,?,?,?,?,?)`,
                                [indexno, identity, id, response, new Date(), agent_id], (err, result) => {
                                    if (err) return res.send(status.internalservererror());
                                    conn.query(`update support_ticket set status='inprogress' where ticket_id='${id}'`, (err2, result2) => {
                                        if (err2 || result2.affectedRows <= 0) return res.send(status.internalservererror());
                                        res.send(status.ok());
                                    });
                                });
                        }).catch((error) => {
                            return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
                        })
                        break;
                    }
                }
            }
        })
});

app.post("/ClientReplyToTicketAgent", async (req, res) => {
    apikey = req.cookies.apikey;
    let id = req.body.id;
    let indexno = req.body.indexno;
    let identity = req.body.identity;
    let contact = req.body.contact;
    let response = req.body.response;
    let agent_email = req.body.agent_email;
    let prefix = "+91";
    contact = prefix.concat(contact);

    const to = agent_email;
    const subject = `Support-Ticket ${id}`;
    const body = `<div><b>Hello ${agent_email},</b><br><br>Ticket-Id: #${id}<br><br>subject: ${subject}<br><br>description:${response}</div>`;

    const sender = {
        "hostname": await findData(apikey, 'hostname'),
        "port": await findData(apikey, 'port'),
        "email": await findData(apikey, 'email'),
        "passcode": await findData(apikey, 'emailpasscode')
    };

    sendEmail(sender, { to: to, bcc: "" }, subject, body).then(() => {
        conn.query(`INSERT INTO ticket_reply VALUES (?,?,?,?,?,?)`, [indexno, identity, id, response, new Date(), apikey], (err, result) => {
            if (err) return res.send(status.internalservererror());
            conn.query(`update support_ticket set status='inprogress' where ticket_id='${id}'`, (err2, result2) => {
                if (err2 || result2.affectedRows <= 0) return res.send(status.internalservererror());
                res.send(status.ok());
            });
        });
    }).catch((error) => {
        return console.log(`error in Sending  E-Mail ::::::: <${error}>`);
    })
});

app.get("/dis_cstm_template", function (req, res) {
    apikey = req.cookies.apikey;
    conn.query("select * from cstm_template where apikey='" + apikey + "'",
        function (err, rest1) {
            if (err || rest1.length < 0) return res.send(status.nodatafound());
            res.send(rest1);
        }
    );
});

function dynamicReplace(message, clientobj, selectedcol) {
    let msgarray = [];
    let valueArrays = Array.from({ length: selectedcol.length }, () => []);

    for (let k = 0; k < clientobj.length; k++) {
        let tempmsg = message;
        for (let i = 0; i < selectedcol.length; i++) {
            let placeholder = `[value-${i + 1}]`;
            let colIndex = Object.keys(clientobj[k]).indexOf(selectedcol[i]);
            let value = colIndex !== -1 ? Object.values(clientobj[k])[colIndex] : "";
            valueArrays[i].push(value);
            tempmsg = tempmsg.replace(placeholder, value);
        }
        msgarray.push(tempmsg);
    }
    return { messages: msgarray, values: valueArrays };
}

// Similarly implement logic for three, four, and five functions


function one(message, clientobj, selectedcol) {
    let keys = Object.keys(clientobj[0]);
    let msgarray = new Array();
    let value1arr = new Array();

    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < selectedcol.length; j++) {
            if (keys[i] == selectedcol[j]) {
                for (let k = 0; k < clientobj.length; k++) {
                    let values = Object.values(clientobj[k]);
                    if (keys[i] == selectedcol[0]) {
                        value1arr.push(values[i]);
                    }
                }
            }
        }
    }
    let tempmsg;
    for (let k = 0; k < clientobj.length; k++) {
        tempmsg = message.replace("[value1]", value1arr[k]);
        msgarray.push(tempmsg);
    }
    return msgarray;
}

function two(message, clientobj, selectedcol) {
    let keys = Object.keys(clientobj[0]);
    let msgarray = new Array();
    let value1arr = new Array();
    let value2arr = new Array();

    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < selectedcol.length; j++) {
            if (keys[i] == selectedcol[j]) {
                for (let k = 0; k < clientobj.length; k++) {
                    let values = Object.values(clientobj[k]);
                    if (keys[i] == selectedcol[0]) {
                        value1arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[1]) {
                        value2arr.push(values[i]);
                    }
                }
            }
        }
    }
    let tempmsg;
    for (let k = 0; k < clientobj.length; k++) {
        tempmsg = message.replace("[value1]", value1arr[k]);
        tempmsg = tempmsg.replace("[value2]", value2arr[k]);
        msgarray.push(tempmsg);
    }
    return msgarray;
}


function three(message, clientobj, selectedcol) {
    let keys = Object.keys(clientobj[0]);
    let msgarray = new Array();
    let value1arr = new Array();
    let value2arr = new Array();
    let value3arr = new Array();
    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < selectedcol.length; j++) {
            if (keys[i] == selectedcol[j]) {
                for (let k = 0; k < clientobj.length; k++) {
                    let values = Object.values(clientobj[k]);
                    if (keys[i] == selectedcol[0]) {
                        value1arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[1]) {
                        value2arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[2]) {
                        value3arr.push(values[i]);
                    }
                }
            }
        }
    }
    let tempmsg;
    for (let k = 0; k < clientobj.length; k++) {
        tempmsg = message.replace("[value1]", value1arr[k]);
        tempmsg = tempmsg.replace("[value2]", value2arr[k]);
        tempmsg = tempmsg.replace("[value3]", value3arr[k]);
        msgarray.push(tempmsg);
    }
    return msgarray;
}

function four(message, clientobj, selectedcol) {
    let keys = Object.keys(clientobj[0]);
    let msgarray = new Array();
    let value1arr = new Array();
    let value2arr = new Array();
    let value3arr = new Array();
    let value4arr = new Array();
    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < selectedcol.length; j++) {
            if (keys[i] == selectedcol[j]) {
                // let custommsg;
                for (let k = 0; k < clientobj.length; k++) {
                    let values = Object.values(clientobj[k]);
                    if (keys[i] == selectedcol[0]) {
                        value1arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[1]) {
                        value2arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[2]) {
                        value3arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[3]) {
                        value4arr.push(values[i]);
                    }
                }
            }
        }
    }
    let tempmsg;
    for (let k = 0; k < clientobj.length; k++) {
        tempmsg = message.replace("[value1]", value1arr[k]);
        tempmsg = tempmsg.replace("[value2]", value2arr[k]);
        tempmsg = tempmsg.replace("[value3]", value3arr[k]);
        tempmsg = tempmsg.replace("[value4]", value4arr[k]);
        msgarray.push(tempmsg);
    }
    return msgarray;
}

function five(message, clientobj, selectedcol) {
    let keys = Object.keys(clientobj[0]);
    let msgarray = new Array();
    let value1arr = new Array();
    let value2arr = new Array();
    let value3arr = new Array();
    let value4arr = new Array();
    let value5arr = new Array();

    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < selectedcol.length; j++) {
            if (keys[i] == selectedcol[j]) {
                for (let k = 0; k < clientobj.length; k++) {
                    let values = Object.values(clientobj[k]);
                    if (keys[i] == selectedcol[0]) {
                        value1arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[1]) {
                        value2arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[2]) {
                        value3arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[3]) {
                        value4arr.push(values[i]);
                    }
                    if (keys[i] == selectedcol[4]) {
                        value5arr.push(values[i]);
                    }
                }
            }
        }
    }
    let tempmsg;
    for (let k = 0; k < clientobj.length; k++) {
        tempmsg = message.replace("[value1]", value1arr[k]);
        tempmsg = tempmsg.replace("[value2]", value2arr[k]);
        tempmsg = tempmsg.replace("[value3]", value3arr[k]);
        tempmsg = tempmsg.replace("[value4]", value4arr[k]);
        tempmsg = tempmsg.replace("[value5]", value5arr[k]);
        msgarray.push(tempmsg);
    }
    return msgarray;
}

app.post("/createworkflow", async (req, res) => {
    apikey = req.cookies.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            const iid = req.body.iid;
            const generateUniqueId = () => {
                const prefix = "W-";
                const maxLength = 6 - prefix.length;
                const maxNumber = Math.pow(10, maxLength) - 1;
                const uniqueId = Math.floor(Math.random() * maxNumber) + 1;
                return prefix + uniqueId.toString().padStart(maxLength, '0');
            };
            const wid = generateUniqueId();
            let wname = req.body.wname;
            conn.query(`insert into workflow (workflow_id,workflow_name,apikey,instance_id) values(?,?,?,?)`,
                [wid, wname, apikey, iid],
                (err, result) => {
                    if (err) return res.send(status.internalservererror());
                    return res.send(status.ok());
                });
        } else return res.send(status.unauthorized());
    }
    catch (e) {
        return res.send(status.unauthorized());
    }
});

app.post("/getAdminData", function (req, res) {
    conn.query(`select * from ${req.body.table}`, (err, result) => {
        if (err) return res.send(status.internalservererror());
        res.send(result);
    });
});

app.get("/ticket_users", (req, res) => {
    conn.query(`SELECT distinct s.apikey,u.uname FROM support_ticket s,users u where s.apikey=u.apikey`, (err, result) => {
        if (err) res.send(err);
        if (result.length > 0) {
            res.send(result);
        }
    })
})

// updatedcode api 12/02/2024 6:50
app.get("/api/getinstance", async (req, res) => {
    apikey = req.headers.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            try {
                const data = {
                    table: `instance`,
                    paramstr: true,
                    apikey: apikey
                };
                tableData(data, (result) => {
                    res.send(result);
                });
            } catch (e) {
                console.log(e);
            }
        }
        else {
            return res.status(404).send({
                "Error Code": "404",
                "Message": "Apikey is invalid / missing"
            });
        }
    }
    catch (e) {
        return res.status(404).send({
            "Error Code": "404",
            "Message": "Apikey is invalid / missing"
        });
    }
})

app.post("/api/setpasscode", async (req, res) => {
    apikey = req.headers.apikey;

    const isValidapikey = await checkAPIKey(apikey);
    try {
        if (isValidapikey) {
            if (req.body.emailtype && req.body.passcode) {
                let query = ``;
                if (req.body.emailtype == "gmail") {
                    query = "update users set emailpasscode='" + req.body.passcode + "' where apikey='" + req.cookies.apikey + "'";
                }
                else {
                    if (!req.body.hostname || !req.body.port) return res.status(404).send({
                        "Error Code": "404",
                        "Message": "Invalid Body / missing hostname or port"
                    });
                    query = `update users set emailpasscode='${passcode}',hostname='${req.body.hostname}',port=${req.body.port} where apikey='${req.cookies.apikey}'`;
                }
                conn.query(query, (err, result) => {
                    if (err) return res.status(500).send(status.internalservererror());
                    if (result.affectedRows == 1) {
                        res.send(status.ok());
                    } else {
                        res.status(500).send(status.internalservererror());
                    }
                });
            }
            else {
                res.status(404).send({
                    "Error Code": "404",
                    "Message": "Invalid Body / missing emailtype or passcode"
                });
            }
        }
        else {
            return res.status(404).send({
                "Error Code": "404",
                "Message": "Apikey is invalid / missing"
            });
        }
    }
    catch (e) {
        return res.status(404).send({
            "Error Code": "404",
            "Message": "Invalid Body / missing data"
        });
    }
});

//log INSERT
function logAPI(api, apikey, iid, requestBody, type) {
    const logid = `log-${crypto.randomBytes(6).toString("hex")}`;
    const jsonpayload = JSON.stringify(requestBody);
    conn.query(`insert into log values(?,?,?,?,?,?,?)`,
        [logid, apikey, iid, api, jsonpayload, type, new Date()],
        function (err, res) {
            if (err) {
                return status.internalservererror().status_code;
            } else {
                return status.ok().status_code;
            }
        });
}


app.use((req, res) => {
    res.status(404).sendFile(`${__dirname}/pages/404.html`);
});

app.listen(port, () => {
    console.log(`${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`Your server is up and running on : ${port}`);
    // console.log(`http://localhost:${port}/signin`);
    // console.log(`https://swiftsend.click`);
});
