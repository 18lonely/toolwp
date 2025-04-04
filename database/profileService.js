const {findProfile, updateProfile, deleteProfile, findProfiles, saveProfile} = require('./profileDb')
const Profile = require('./profileModel')
const mongoose = require('mongoose')

const path = require('path')

const locateSaveProfile = path.resolve(__dirname, "../chrome/profiles/")

exports.getProfileByID = async (id) => {
    try {
        const profile = await findProfile({_id: id}, '-__v')
        if(profile) {
            return profile
        } else {
            console.log('Profile not found!')
        }
    } catch (err) {
        throw new Error('Unable to find profile!')
    }
}

exports.updateProfile = async (id, newProfile) => {
    try {
        const profile = new Profile()
        const profileFound = await findProfile({_id: id}, '-__v')

        console.log(id)
        if(!profileFound) {
            throw new Error('Profile not found!')
        }

        newProfile = Object.assign(profile, newProfile)
        const result = await updateProfile({_id: id}, newProfile)

        return result
    } catch (err) {
        throw new Error('Profile cannot update!')
    }
}

exports.deleteProfile = async (id) => {
    try {
        const result = await deleteProfile({_id: id})
        return result
    } catch(err) {
        throw new Error("Cannot delete Profile")
    }
}

exports.getAllProfile = async (page, limit) => {
    try {
        page = page || 1
        limit = limit || 10
        const skip = (page - 1) * limit
        const result = await findProfiles({}, '-__v', skip, limit)

        const totalProfile = await Profile.countDocuments({})
        const totalPage = Math.ceil(totalProfile / limit)

        console.log('Get all profile successfully!')
        
        return {
            profiles: result,
            page: page,
            totalPage: totalPage
        }
    } catch(err) {
        throw new Error('Cannot Get All Profile')
    }
}

exports.addNewProfile = async (newProfile) => {
    try {
        let profile = new Profile()
        profile._id = new mongoose.Types.ObjectId()
        
        newProfile = Object.assign(profile, newProfile)
        newProfile.storage = locateSaveProfile + '\\' + newProfile._id.toString()
        const result = await saveProfile(newProfile)
        console.log('Save profile successfully!')
        return true
    } catch(err) {
        throw new Error('Cannot save profile!')
    }
}


