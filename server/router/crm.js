const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");

// Toggle CuTe Team Status
router.put('/user/toggle-team/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.isCuTeTeam = !user.isCuTeTeam;
        await user.save();

        res.status(200).json({ 
            message: `${user.username} is ${user.isCuTeTeam ? 'now' : 'no longer'} on the team!`,
            isCuTeTeam: user.isCuTeTeam 
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Fetch all CuTe Team Members
// Fetch all CuTe Team Members
router.get('/team', async (req, res) => {
    try {
        const team = await User.find({ isCuTeTeam: true }).select('name username photo _id');
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch team members." });
    }
});

module.exports = router;