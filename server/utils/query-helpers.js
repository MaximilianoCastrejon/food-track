import Product from "../models/Product.js";

export const buildQuery = (queryParams) => {
  const { name, nameOptions, category, numericFields } = queryParams;
  const query = {};
  //  STRING FIELDS
  if (category) {
    query.category = category;
  }
  // TODO: Implement search algorithm for name for search prediction
  if (name) {
    query.name = { $regex: name, $options: nameOptions || "" };
  }

  // NUMERIC FIELDS
  if (numericFields) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const filterOperator = /\b(<|<=|=|>=|>)\b/g;
    let filters = numericFields.replace(
      filterOperator,
      (operator) => `-${operatorMap[operator]}-`
    );
    const options = ["price", "rating", "supply", "createdAt"];
    filters = filters.split(",").forEach((item) => {
      const [field, operator, filterValue] = item.split("-");
      if (options.includes(field)) {
        query[field] = { [operator]: Number(filterValue) };
      }
    });
  }
  return query;
};

export const buildPagination = async (query, pagParams) => {
  const page = Number(pagParams.page) || 1;
  const limit = Number(pagParams.limit) || 10;

  // Solutions: Use two queries || use a function inbetween facets of the pipeline to get totalDocuments
  const totalDocuments = await Product.countDocuments(query);
  const totalPages =
    Math.ceil(totalDocuments / limit) === 0
      ? 1
      : Math.ceil(totalDocuments / limit);

  const toPage =
    limit * (page <= totalPages ? (page < 1 ? 0 : page - 1) : totalPages - 1);

  return { skip: toPage, limit: limit };
};

export const buildProjection = (onlyShow) => {
  if (onlyShow) {
    return onlyShow.split(",").join(" ");
    l;
  }
  return "";
};

export const applySorting = (result, sort) => {
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }
  return result;
};

export const applyProjection = (result, onlyShow) => {
  if (onlyShow) {
    const desiredFields = onlyShow.split(",").join(" ");
    result = result.select(desiredFields);
  }
  return result;
};
export const applyPagination = (result, pagination) => {
  result = result.skip(pagination.skip).limit(pagination.limit);
  return result;
};
