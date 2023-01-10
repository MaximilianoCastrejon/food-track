export const buildQuery = async (
  collection,
  { queryParams, numQuery },
  { projection, sort, pagination }
) => {
  console.log("queryParams", queryParams);
  console.log("numQuery", numQuery);
  console.log("projection", projection);
  console.log("sort", sort);
  console.log("pagination", pagination);
  // Initialize the query object
  if (projection) {
    const show = projection.split(",").join(" ");
    query = query.select(show);
  }

  if (numQuery) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const filterOperator = /\b(<|<=|=|>=|>)\b/g;
    let filters = numQuery.numericFilters.replace(
      filterOperator,
      (operator) => `-${operatorMap[operator]}-`
    );
    filters = filters.split(",").forEach((item) => {
      const [field, operator, filterValue] = item.split("-");
      if (numQuery.options.includes(field)) {
        query[field] = { [operator]: Number(filterValue) };
      }
    });
  }

  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  if (pagination) {
    result = result.skip(pagination.skip).limit(pagination.limit);
    return result;
  }
  // Loop through the query parameters
  Object.keys(queryParams).forEach((key) => {
    // Check if the key is a valid field in the collection
    if (collection.schema.path(key)) {
      // Add the query condition for the field
      query = query.where(key, queryParams[key]);
    }
  });
  let query = await collection.find({});

  // Return the built query
  return query;
};
