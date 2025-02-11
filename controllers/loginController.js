exports.login = async (req, res) => {
  try {
    console.log("Received login request:", req.body);  // Log incoming data

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Incorrect password for:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, gender: user.gender },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("Login successful, token generated:", token);

    res.status(200).json({
      token,
      id: user._id,
      role: user.role,
      name: user.name,
      gender: user.gender,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};
