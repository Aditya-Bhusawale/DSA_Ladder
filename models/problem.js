const mongoose=require("mongoose");

const testcaseschema = new mongoose.Schema({
    _id:false,
    input:{
        type:String,
        required:true,
    },
    expected_output:{
        type:String,
        required:true,
    },
    isPublic:{
        type:Boolean,
        default:false,
    },
});

const problemschema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    testcases:[testcaseschema],
    topic:{
        type:String,
        required:true,
    },

});

const problem=mongoose.model("problem",problemschema);

module.exports={problem};