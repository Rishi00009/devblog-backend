const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Post = require("./models/Post");
const User = require("./models/User");

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected 🚀");

    // Clear old data
    await User.deleteMany();
    await Post.deleteMany();

    // Create demo user
    const demoUser = await User.create({
      name: "Demo User",
      email: "demo@example.com",
      password: "123456",
    });

    // Insert demo posts
    await Post.insertMany([
      {
        title: "Welcome to My Blog",
        content: "This is the first seeded post. 🚀",
        isPublished: true,
        author: demoUser._id,
      },
      {
        title: "Learning MERN Stack",
        content: "MongoDB, Express, React and Node!",
        isPublished: true,
        author: demoUser._id,
      },
      {
        title: "Draft Post Example",
        content: "This one is a draft and not published yet!",
        isPublished: false,
        author: demoUser._id,
      },
    ]);

    console.log("🌱 Seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
