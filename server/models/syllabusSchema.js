const mongoose = require("mongoose");

// Level 5: Sub-Subtopics (For the really deep stuff, like Biology!)
const subSubtopicSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Medulla Oblongata"
});

// Level 4: Subtopics
const subtopicSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Structure of the Brain"
  subSubtopics: [subSubtopicSchema]        // <-- Plugged in here!
});

// Level 3: Topics
const topicSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Central Nervous System"
  subtopics: [subtopicSchema]
});

// Level 2: Chapters
const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Neural Control and Coordination"
  topics: [topicSchema]
});

// Level 1: Subjects
const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Biology"
  chapters: [chapterSchema]
});

// Level 0: The Main Syllabus Document
const syllabusSchema = new mongoose.Schema({
  classSemester: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  }, // e.g., "Class 11 Science"
  subjects: [subjectSchema]
}, { timestamps: true });

module.exports = mongoose.model("Syllabus", syllabusSchema);