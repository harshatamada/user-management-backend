const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;


  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    
    db.query(
      "SELECT * FROM user_data WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "DB error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
          "INSERT INTO user_data (name, email, password) VALUES (?, ?, ?)",
          [name, email, hashedPassword],
          (insertErr, result) => {
            if (insertErr) {
              console.log(insertErr);
              return res.status(500).json({ message: "DB insert error" });
            }
            return res
              .status(201)
              .json({ message: "User registered successfully!" });
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
});

const jwt = require("jsonwebtoken");

// Login Route
// Login Route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query(
    "SELECT * FROM user_data WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "DB error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Create JWT token for both user/admin
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // If admin → also get all users
      if (user.role === "admin") {
        db.query("SELECT id, name, email, role FROM user_data", (error, users) => {
          if (error) {
            console.log(error);
            return res.status(500).json({ message: "DB error" });
          }

          return res.status(200).json({
            message: "Admin login successful!",
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            users // full list for admin only
          });
        });
      } else {
        // Normal user response
        return res.status(200).json({
          message: "User login successful!",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    }
  );
});

const authMiddleware = require("../middleware/auth");

// Get logged-in user data (Protected Route)
router.get("/me", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, name, email, role FROM user_data WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "DB error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(results[0]);
    }
  );
});

const adminMiddleware = require("../middleware/admin");

module.exports = router;
