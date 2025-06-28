const express=require("express");
const path=require("path");
const mongoose=require("mongoose");
const {problem}=require("./models/problem.js");
const {user}=require("./models/user.js");
const axios=require("axios");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require('passport-local');
const { title } = require("process");
const {isloggedin}=require("./middleware.js");

const app=express();


app.use(session({
  secret: 'mysupersecretcode',  // change to a strong secret
  resave: false,
  saveUninitialized: true,
   cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  },
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


app.set('view engine', 'ejs');
app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.urlencoded({ extended: true }));

main()
.then(()=>{
    console.log("successful connection");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/dsa');

}

// app.get("/",(req,res)=>{
//     res.send("home");
// })

// topic select 
app.get("/topic", isloggedin, (req, res) => {
    res.render("topic.ejs"); 
});


app.post("/topic",async(req,res)=>{
    let usertopic=req.body.topic;
    let question=await problem.find({topic:usertopic});
    res.render("questions_list.ejs",{question});
})

// individual problem

app.get("/topic/:id",async(req,res)=>{
    let {id}=req.params;
    let question = await problem.findById(id);
    console.log({question});
    res.render("index.ejs",{question});
});


app.post("/topic/:id", async (req, res) => {
    const { id } = req.params;
    const { code, language } = req.body;
    const question = await problem.findById(id);
    const testResults = [];

    const normalize = (str) => str.trim().replace(/\s+/g, ' ');

    // Language mapping
    const langMap = {
        "54": "cpp",
        "62": "java",
        "71": "python3"
    };

    const pistonLang = langMap[language] || "cpp";

    for (let test of question.testcases) {
        try {
            const result = await axios.post("https://emkc.org/api/v2/piston/execute", {
                language: pistonLang,
                version: "*",
                files: [{ name: "main", content: code }],
                stdin: test.input
            });

            const user_output = result.data.run.stdout || "";
            const passed = normalize(user_output) === normalize(test.expected_output);

            testResults.push({
                input: test.input,
                expected: test.expected_output,
                user_output,
                passed
            });

        } catch (err) {
            console.error("Execution error:", err.message);
            testResults.push({
                input: test.input,
                expected: test.expected_output,
                user_output: "Error running code",
                passed: false
            });
        }
    }



    res.render("result.ejs", { question, testResults,code});
});

// signup

app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
})

app.post("/signup",async(req,res)=>{
    try{
        let {username,email,password}=req.body;
        let newuser=new user({username,email});

        await user.register(newuser,password);
        res.redirect("/topic");
    }
    catch(err){
        res.redirect("/signup");
    }
})

// login

app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

app.post("/login",passport.authenticate("local",
    {failureRedirect:"/login",
        failureFlash:true}),
        async(req,res)=>{
    res.redirect("/topic");
})

//logout

app.get("/logout",(req,res,next)=>{
    req.logOut((err)=>{
        return next(err);
    })

    res.redirect("/login");
})

// submission

app.post("/submission/:id", async (req, res) => {
  const { code } = req.body;
  const { id } = req.params;

  // Check if user is logged in
  if (!req.user) {
    return res.redirect("/login");
  }

  const curruser_id = req.user._id;

  const solved_problem = await problem.findById(id);


  // Add the problem ID to the user's solved submissions
  await user.findByIdAndUpdate(curruser_id, {
    $addToSet: { submissions: id } // Use $addToSet to prevent duplicates
  });

//   let curruser=await user.findById(curruser_id);
//   let point=curruser.points;
//   point=point+4;

//   await user.findByIdAndUpdate(curruser_id,{
//     $addToSet:{points:point}
//   });

//   console.log(point);

  res.render("records/usercode.ejs", { code });
});


app.get("/submission",async (req,res)=>{
    
    if (!req.user) {
        return res.redirect("/login");
    }

    const curruser_id = req.user._id;
    let curruser = await user.findById(curruser_id);
    console.log({ curruser });

    let questions=[];
    for(let p of curruser.submissions){

        let q=await problem.findById(p);
        // console.log(q);
        questions.push(q.title);
    }
    res.render("records/submission.ejs",{questions});
})

//profile

app.get("/profile",(req,res)=>{
    let user=req.user;
    res.render("profile.ejs",{user});
})

// app.get("/problem", async (req, res) => {

//   const newProblem = new problem({
//     title: "Find the Largest in an Array",
//     description: "Given an array, find the largest element.",
//     tag: "Array",
//     testcases: [],
//   });

//   const insertedtestcase=await testcase.insertMany([
//     { input: "5\n1 8 7 56 90", expected_output: "90" },
//     { input: "4\n5 5 5 5", expected_output: "5" },
//     { input: "1\n10", expected_output: "10" },
//   ]);

//   insertedtestcase.forEach(tc=>{
//     newProblem.testcases.push(tc._id);
//   });
  
//   await newProblem.save();

//   res.send("Problem with multiple test cases saved.");
// });


app.listen(8080,()=>{
    console.log("server listening at port 8080");
})