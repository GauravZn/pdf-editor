import mongoose from "mongoose"

mongoose.connect('mongodb://127.0.0.1:27017/signature_finale')
.then(()=>console.log("connected to the DB."))
.catch((err)=>console.log("connection error ->", err))

const signerSchema = new mongoose.Schema({
    name:String,
    email:String,
    seq:Number,
    status:{type: String, default:'pending'}
})

const workFlowSchema = new mongoose.Schema({
    title:{type:String, default:"new signature request"},
    signers:[signerSchema],
    createdAt:{type:Date, default: Date.now}
})

const workFlow = new mongoose.model('Workflow', workFlowSchema)

export default workFlow