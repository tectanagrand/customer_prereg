const db = require("../config/connection");

const PageModel = {};

PageModel.showAll = async role_id => {
    const client = await db.connect();
    const promises = [];
    const menuAccess = new Map();
    const menuName = new Map();
    try {
        const { rows: dataHeadMenu } = await client.query(
            `SELECT MP.*, MPA.fcreate, MPA.fread, MPA.fupdate, MPA.fdelete
    FROM MST_PAGE MP
    LEFT JOIN MST_PAGE_ACCESS MPA ON MP.MENU_ID = MPA.PAGE_ID
    WHERE MPA.ROLE_ID = $1
      AND PARENT_ID IS NULL
      AND TYPE = 'M'
      AND fread = true
      AND MP.is_active = true
      ORDER BY position`,
            [role_id]
        );
        dataHeadMenu.forEach(item => {
            promises.push(
                client.query(
                    `SELECT MP.*, MPA.fcreate, MPA.fread, MPA.fupdate, MPA.fdelete
      FROM MST_PAGE MP
      LEFT JOIN MST_PAGE_ACCESS MPA ON MP.MENU_ID = MPA.PAGE_ID
      WHERE MPA.ROLE_ID = $1
        AND PARENT_ID = $2
        AND TYPE = 'M'
        AND fread = true
        ORDER BY position`,
                    [role_id, item.menu_id]
                )
            );
        });
        const dataChildMenu = await Promise.all(promises);
        dataHeadMenu.forEach((item, index) => {
            const childMenu = dataChildMenu[index].rows.map(item => {
                menuName.set(item.menu_link, item.menu_page);
                return {
                    key: item.menu_id,
                    text: item.menu_page,
                    url: item.menu_link,
                    access: [
                        item.fcreate,
                        item.fread,
                        item.fupdate,
                        item.fdelete,
                    ],
                };
            });
            menuAccess.set(item.menu_id, {
                key: item.menu_id,
                text: item.menu_page,
                icon: item.icons,
                access: [item.fcreate, item.fread, item.fupdate, item.fdelete],
                children: childMenu,
            });
        });
        const jsonMenu = Object.fromEntries(menuAccess);
        const nameMenu = Object.fromEntries(menuName);
        return {
            jsonMenu: jsonMenu,
            nameMenu: nameMenu,
        };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = PageModel;
