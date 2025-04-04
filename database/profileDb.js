const Profile = require('./profileModel')

const findProfiles = async (obj, selectedValues, skip, limit) => {
    return await Profile.find(obj)
                        .select(selectedValues)
                        .sort({profilename: 1})
                        .exec()
                        .then(profiles => profiles.map(profile => ({
                            ...profile,
                            _id: profile._id.toString()
                        })))
}

const updateProfile = async (filter, update) => {
    return await Profile.updateOne(filter, update, {new: true}).exec()
}

const deleteProfile = async (obj) => {
    return await Profile.deleteOne(obj).exec()
}

const findProfile = async (obj) => {
    return await Profile.findOne(obj)
}

const saveProfile = async (newProfile) => {
    return await newProfile.save()
}

module.exports = {findProfile, updateProfile, deleteProfile, findProfiles, saveProfile}