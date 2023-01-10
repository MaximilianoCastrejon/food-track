import React from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Button,
  Typography,
  Rating,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Header from "components/Header";
import { useGetProductsQuery } from "states/api";

const Product = ({
  _id,
  name,
  description,
  price,
  rating,
  category,
  supply,
  stat,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <Card
      sx={{
        backgroundImage: "none",
        backgroundColor: theme.palette.background.alt,
        borderRadius: "0.55rem",
      }}
    >
      <CardContent>
        <Typography
          sx={{ fontSize: 14 }}
          color={theme.palette.secondary[700]}
          gutterBottom
        ></Typography>
      </CardContent>
    </Card>
  );
};

// TODO: write a pop-up that opens a menu on a button click
// and sends the returned values from a request as props
// import React from 'react';
// import { Route } from 'react-router-dom';
// import ProductFormModal from './ProductFormModal';

// const ProductsRoute = () => {
//   const ingredients = [
//     { name: 'lettuce', _id: '1' },
//     { name: 'tomatoes', _id: '2' },
//     { name: 'onions', _id: '3' }
//   ];

//   return (
//     <Route
//       path="/products/new"
//       render={(props) => <ProductFormModal {...props} ingredients={ingredients} categories={categories} ingredients={ingredients} />}
//     />
//   );
// };

// export default ProductsRoute;

function Products() {
  const { data, isLoading } = useGetProductsQuery();
  const isNonMobile = useMediaQuery("(min-width: 1000px)");
  console.log("data", data);
  return (
    <Box m="1.5rem 2.5rem">
      <Header title={"PRODUCTS"} subtitle={"Products subtitle"} />
      {data || !isLoading ? (
        <Box
          mt="20px"
          display="grid"
          gridTemplateColumns="repeat(4,minmax(0, 1fr))"
          justifyContent="space-between"
          rowGap="20px"
          columnGap="1.33%"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
          }}
        >
          {data.products.map()}
        </Box>
      ) : (
        <>Loading...</>
      )}
    </Box>
  );
}

export default Products;
