const { ZodObject, ZodError } = require("zod");

/**
 *
 * @param {ZodObject} schema
 */
const ValidationMid = schema => {
    return (req, res, next) => {
        try {
            let payload;
            if (req.method == "POST") {
                payload = req.body;
            } else {
                payload = req.query;
            }
            schema.parse(payload);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map(issue => ({
                    message: `${issue.path.join(".")} is ${issue.message}`,
                }));
                res.status(400).send({
                    error: "Invalid data",
                    details: errorMessages,
                });
            } else {
                res.status(500).send({
                    message: error.message,
                });
            }
        }
    };
};

module.exports = ValidationMid;
