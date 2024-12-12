const mongoose=require('mongoose');
const schema=mongoose.Schema;
 
const userschema=new schema({
    username:{
        required:true,
        unique:true,
        type:String
    },
    password:{
        required:true,
        type:String,
        
    }
},{timestamps:true})

const usermodel=mongoose.model('User',userschema);
module.exports=usermodel;