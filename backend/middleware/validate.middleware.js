const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const firstError = result.error.issues?.[0];
    return res.status(400).json({
      message: firstError?.message || "Invalid request data",
    });
  }

  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  return next();
};

module.exports = { validate };

