
const isloggedin=(req,res,next)=>{
        if(!req.isAuthenticated()){
            req.flash("error","you must be logged in to create new listing!");
            return res.redirect("/login");
        }
    next();
}

module.exports={isloggedin};
