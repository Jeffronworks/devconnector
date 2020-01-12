const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Passport = require("passport");

// Load Post model
const Post = require("../../models/Post");

// Load Profile model
const Profile = require("../../models/Profile");

// Validation
const validatePostInput = require("../../validation/post");

// @route    GET api/posts/test
// @desc     Tests posts route
// @ access  Public
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

// @route    GET api/posts
// @desc     Get posts
// @ access  Public
router.get("/", async (req, res) => {
  const posts = await Post.find()
    .sort({ date: -1 })
    .catch(error => res.status(404).json({ nopostsfound: "No posts found" }));
  return res.json(posts);
});

// @route    GET api/posts/:id
// @desc     Get post by id
// @ access  Public
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).catch(error =>
    res.status(404).json({ nopostfound: "No post found with that id" })
  );
  return res.json(post);
});

// @route    POST api/posts
// @desc     Create posts route
// @ access  Private
router.post(
  "/",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
      // If any errors, send 400 with error object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    const post = await newPost.save();
    res.json(post);
  }
);

// @route    DElETE api/posts/:id
// @desc     Delete posts
// @ access  Private
router.delete(
  "/:id",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).catch(err =>
      res.json(err)
    );
    const post = await Post.findById(req.params.id).catch(err => res.json(err));
    // Check for post owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ notauthorized: "User not authorized" });
    }
    // DELETE
    await post.remove().catch(err => res.json(err));
    res.json({ success: true });
  }
);
// @route    POST api/posts/like/:id
// @desc     Like posts
// @ access  Private
router.post(
  "/like/:id",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).catch(err =>
      res.json(err)
    );
    let post = await Post.findById(req.params.id).catch(err => res.json(err));

    // Check if the user already liked the post
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res
        .status(400)
        .json({ alreadyliked: "User already liked this post" });
    }
    // Add the user id to the likes array
    post.likes.unshift({ user: req.user.id });
    // save post
    post = await post.save().catch(err => res.json(err));
    res.json(post);
  }
);

// @route    POST api/posts/unlike/:id
// @desc    Unlike posts
// @ access  Private
router.post(
  "/unlike/:id",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).catch(err =>
      res.json(err)
    );
    let post = await Post.findById(req.params.id).catch(err => res.json(err));

    // Check if the user already liked the post
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res
        .status(400)
        .json({ notliked: "You have not yet liked this post" });
    }

    //Get remove index
    const removeIndex = post.likes
      .map(item => item.user.toString())
      .indexOf(req.user.id);

    // Splice of array
    post.likes.splice(removeIndex, 1);
    // save post
    post = await post.save().catch(err => res.json(err));
    res.json(post);
  }
);

// @route    POST api/posts/comment/:id
// @desc     Add comment to a post
// @ access  Private
router.post(
  "/comment/:id",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Check validation
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      // If any errors, send 400 with error object
      return res.status(400).json(errors);
    }
    let post = await Post.findById(req.params.id).catch(() =>
      res.status(404).json({ noPost: "no post with that id" })
    );

    const newComment = {
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    };
    // Add newComment to comments array
    post.comments.unshift(newComment);
    // save post
    post = await post
      .save()
      .catch(() => res.status(404).json({ failed: "Failed to save to db" }));
    res.json(post);
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Add comment to a post
// @ access  Private
router.delete(
  "/comment/:id/:comment_id",
  Passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let post = await Post.findById(req.params.id).catch(() =>
      res.status(404).json({ noPost: "no post with that id" })
    );
    // Check to see if comments exists
    if (
      post.comments.filter(
        comment => comment._id.toString() === req.params.comment_id
      ).length === 0
    ) {
      return res
        .status(404)
        .json({ commentnotexist: "Comment does not exist" });
    }
    //Get remove index
    const removeIndex = post.comments
      .map(item => item._id.toString())
      .indexOf(req.params.comment_id);

    // Splice of array
    post.comments.splice(removeIndex, 1);

    // save post
    post = await post
      .save()
      .catch(() => res.status(404).json({ failed: "Failed to save to db" }));
    res.json(post);
  }
);
module.exports = router;
