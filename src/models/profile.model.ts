import mongoose, { Schema } from 'mongoose';

const profileSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        name: { type: String, required: true, trim: true, uppercase: true },
        licenseNumber: { type: String, required: true, uppercase: true, trim: true },
        driverId: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        vehicleType: { type: String, required: true },
        emergencyContact: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
        },
        issueDate: { type: String, required: true },
        expiryDate: { type: String, required: true },
        status: { type: String, enum: ['Valid', 'Expired', 'Suspended'], required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
