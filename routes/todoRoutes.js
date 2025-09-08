import express from "express";
import Todo from "../models/Todo.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ GET all todos (protected)
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ POST create a new todo (protected)
router.post("/", authenticateJWT, async (req, res) => {
  const todo = new Todo({
    title: req.body.title,
    userId: req.user.id, // associate todo with authenticated user
  });

  try {
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ PUT update a todo (protected)
router.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const { title, completed } = req.body;

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // ensure it's user's own todo
      {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res
        .status(404)
        .json({ message: "Todo not found or unauthorized" });
    }

    res.status(200).json(updatedTodo);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating todo", error: err.message });
  }
});

// ✅ DELETE a todo (protected)
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const deletedTodo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // ensure it's user's own todo
    });

    if (!deletedTodo) {
      return res
        .status(404)
        .json({ message: "Todo not found or unauthorized" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error deleting todo", error.response?.data || error.message);
  }
});

export default router;
