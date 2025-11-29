const express = require("express");
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/posts  (public: list published posts + optional search)
router.get("/", async (req, res) => {
  try {
    const { search, tag } = req.query;

    const query = { isPublished: true };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    const posts = await Post.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.log("Get posts error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/posts/my  (logged in user's posts – draft + published)
router.get("/my", auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(posts);
  } catch (err) {
    console.log("Get my posts error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/posts/:id  (public: only published posts)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // if not published, block for public
    if (!post.isPublished) {
      return res.status(403).json({ message: "Post is not published" });
    }

    res.json(post);
  } catch (err) {
    console.log("Get single post error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts  (create new post)
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, coverImage, tags, isPublished } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const post = await Post.create({
      title,
      content,
      coverImage: coverImage || "",
      tags: tags || [],
      isPublished: !!isPublished,
      author: req.user._id,
    });

    res.status(201).json(post);
  } catch (err) {
    console.log("Create post error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/posts/:id  (update own post)
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, content, coverImage, tags, isPublished } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.coverImage = coverImage ?? post.coverImage;
    post.tags = tags ?? post.tags;
    if (typeof isPublished === "boolean") {
      post.isPublished = isPublished;
    }

    const updated = await post.save();
    res.json(updated);
  } catch (err) {
    console.log("Update post error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:id  (delete own post)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await post.deleteOne();
    res.json({ message: "Post removed" });
  } catch (err) {
    console.log("Delete post error", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
