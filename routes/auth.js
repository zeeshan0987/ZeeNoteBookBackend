const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');
const JWT_SECRET="zeeshankesite";

// Create a User using : POST "/api/auth/createuser".No login required
router.post(
  "/createuser",
  [
    body("name", "Enter a valid Name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Enter A valid PassWord").isLength({ min: 5 }),
  ],
  async (req, res) => {
    // If there are errors,return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //check whether the user with this email exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ errors: "Sorry a user with this email already exists" });
      }
      const salt = await bcrypt.genSalt(10);

      const secPass = await bcrypt.hash(req.body.password,salt) 
      // Creat a nuw User
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
      });
      const data={
        user:{
          id:user.id
        }
      }
      const authtoken = jwt.sign(data,JWT_SECRET)
      res.json({ authtoken});
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occured");
    }
  }
);
// Authenticate a User using : POST "/api/auth/login".No login required
router.post(
  "/login",
  [
    
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const{email,password}=req.body;
    try {
      let user= await User.findOne({email})
      if (!user) {
        return res.status(400).json({error:"Please try to login with correct credentials"})
      }
      const passwordCompare = await bcrypt.compare(password,user.password)
      if (!passwordCompare) {
        return res.status(400).json({error:"Please try to login with correct credentials"})
      }
      const data={
        user:{
          id:user.id
        }
      }
      const authtoken = jwt.sign(data,JWT_SECRET)
      res.json({ authtoken});
      
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Sever Error");
    }
  })
module.exports = router;
