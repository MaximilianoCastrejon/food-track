export const buildQuery = async (
  collection,
  { stringParams, numQuery },
  { projection, sort, pagination, populate }
) => {
  const queryObject = {};
  if (stringParams) {
    stringParams.forEach((obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        console.log("[key, value]", [key, value]);
        const match = key.match(/(.*)Options/);
        if (match) {
          const field = match[1];
          queryObject[field] = { $regex: obj[field] };
          if (key.endsWith("Options")) {
            queryObject[field]["$options"] = value ? value : "";
          }
        }
      });
    });
  }

  // Give option for range queryObject.createdAt: { $gte: period.from, $lte: period.to }
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
      (operator) => `_${operatorMap[operator]}_`
    );
    const from_fields = new Set();
    filters.split(",").forEach((item) => {
      const [field, operator, filterValue] = item.split("_");
      if (numQuery.options.includes(field)) {
        // If appeard before
        if (from_fields.has(field)) {
          queryObject[field] = {
            ...queryObject[field],
            [operator]: Number(filterValue),
          };
        } else {
          //how can I send two dates in my req.query
          queryObject[field] = { [operator]: Number(filterValue) };
        }

        from_fields.add(field);
      }
    });
  }

  let result = collection.find(queryObject);

  if (projection) {
    const show = projection.split(",").join(" ");
    result = result.select(show);
  }
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  if (pagination) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;

    // Solutions: Use two queries || use a function inbetween facets of the pipeline to get totalDocuments
    const totalDocuments = await collection.countDocuments(queryObject);
    const totalPages =
      Math.ceil(totalDocuments / limit) === 0
        ? 1
        : Math.ceil(totalDocuments / limit);

    const toPage =
      limit * (page <= totalPages ? (page < 1 ? 0 : page - 1) : totalPages - 1);
    result = result.skip(toPage).limit(limit);
    return result;
  }

  if (populate) {
    const pop = populate.split(",").join(" ");
    result = result.populate(pop);
  }
  const orderedResult = await result;

  // Return the built query
  return orderedResult;
};
