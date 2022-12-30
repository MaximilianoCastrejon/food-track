import User from "../models/User.js";

const getUser = async (req, res) => {
  try {
    console.log(req.params);
    const { id: userID } = req.params;
    const user = await User.findOne({ _id: userID });
    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
const createUser = async (req, res) => {
  try {
    const user = await Task.create(req.body);
    res.status(201).json({ user });
  } catch (error) {}
  res.status(200).json({ user });
};

export { getUser, createUser };
