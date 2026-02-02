const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema(
  {
    name: String,
    photo: String,
    text: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [String], // List of usernames who liked the reply
    dislikedBy: [String], // List of usernames who disliked the reply
    replies: [this],
  },
  { timestamps: true }
);

const CommentSchema = new mongoose.Schema(
  {
    name: String,
    photo: String,
    text: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [String], // List of usernames who liked the comment
    dislikedBy: [String], // List of usernames who disliked the comment
    replies: [ReplySchema],
  },
  { timestamps: true }
);

const blogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  // username: { type: String, required: true },
  // userphoto: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [CommentSchema],
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  dislikedBy: [{ type: String }],
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
