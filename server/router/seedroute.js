const express = require("express");
const router = express.Router();
const Syllabus = require("../models/syllabusSchema"); // Make sure path is correct

router.post("/seed/syllabus", async (req, res) => {
  try {
    // 1. Clear out any old test data
    await Syllabus.deleteMany({ classSemester: "Class 11 Science" });

    // 2. Build the 5-Level Deep Syllabus
    const newSyllabus = new Syllabus({
      classSemester: "Class 11 Science",
      subjects: [
        {
          title: "Biology",
          chapters: [
            {
              title: "Human Physiology",
              topics: [
                {
                  title: "Neural Control and Coordination",
                  subtopics: [
                    {
                      title: "Central Nervous System",
                      subSubtopics: [
                        { title: "Cerebrum" },
                        { title: "Medulla Oblongata" } // Level 5!
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          title: "Physics",
          chapters: [
            {
              title: "Kinematics",
              topics: [
                {
                  title: "Motion in a Straight Line",
                  subtopics: [
                    { title: "Average Velocity and Speed" },
                    { title: "Acceleration" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    await newSyllabus.save();
    res.status(201).json({ message: "Class 11 Science Syllabus Seeded Successfully!", data: newSyllabus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;