const { z } = require("zod");

const MasterSchema = {
    plantSave: z.object({
        company_code: z.string(),
        company_name: z.string(),
        plant_code: z.string(),
        plant_name: z.string(),
        alamat: z.string(),
        lokasi: z.string(),
    }),
    plantUpdate: z.object({
        plant_code: z.string(),
        alamat: z.string(),
        lokasi: z.string(),
        plant_name: z.string(),
    }),
    plantDelete: z.object({
        plant_code: z.string(),
    }),
};

module.exports = MasterSchema;
