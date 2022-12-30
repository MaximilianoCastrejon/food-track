import Sale from "../models/Sale.js";

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json({ sales });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
const getUserSales = async (req, res) => {
  try {
    const sales = await Sale.find(/* User*/);
    res.status(200).json({ sales });
  } catch (error) {}
  res.status(200).json({ user });
};

export { getSales, getUserSales };
