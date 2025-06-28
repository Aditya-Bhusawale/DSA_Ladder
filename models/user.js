const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  submissions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Problem",
  }],
    points:{
      type:Number,
      default:0,
    },
});

userSchema.plugin(passportLocalMongoose);

const user=mongoose.model("user", userSchema);

module.exports = {user};
