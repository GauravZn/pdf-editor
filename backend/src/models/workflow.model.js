import mongoose from "mongoose";

// Define the exact shape of a Field 
const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true }, // CRITICAL: Allows 'f-12345' string ID
    type: { type: String, required: true }, 
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    page: { type: Number, default: 1 },
    required: { type: Boolean, default: true },
    // Data added during the signing phase:
    value: { type: String }, 
    color: { type: String }, 
    font: { type: String }
}, { _id: false }); // CRITICAL: Tells Mongoose NOT to overwrite our 'id' with an ObjectId

// the Signer
const signerSchema = new mongoose.Schema({
    name: String,
    email: String,
    seq: Number,
    status: { type: String, default: 'pending' },
    fields: [fieldSchema], // Embed the field schema here
    signedAt: { type: Date },
    ipAddress: String
});

//  the main Workflow
const workflowSchema = new mongoose.Schema({
    title: { type: String, required: true },
    pdfHash: { type: String, required: true, index: true }, 
    pdfPath: { type: String, required: true },
    signers: [signerSchema], 
    createdAt: { type: Date, default: Date.now }
});

const workflow = mongoose.model('Workflow', workflowSchema);

export default workflow;