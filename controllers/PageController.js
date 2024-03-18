const db = require("../config/connection");
const Page = require("../models/PageModel");

const PageController = {};

PageController.showAll = async (req, res) => {
    const role_id = req.body.role_id;
    try {
        const jsonMenu = await Page.showAll(role_id);
        res.status(200).send(jsonMenu);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
};

module.exports = PageController;
