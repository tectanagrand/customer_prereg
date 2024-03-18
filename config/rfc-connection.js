const noderfc = require("node-rfc");

const client = new noderfc.Client({ dest: "Q13" });

(async () => {
    try {
        const param = {
            I_RECORD_REGISTRA: {
                BUKRS: "PS",
                UPLOADID: "1",
                DOTYPE: "S",
                ITEMRULE: "",
                VBELN_REF: "1011100692",
                POSNR: "10",
                EBELN_REF: "",
                CREDAT: "05.03.2024",
                MATNR: "",
                PLN_LFIMG: "5000",
                DWERKS: "",
                DLGORT: "TW51",
                RWERKS: "",
                RLGORT: "TS55",
                ZZTRANSP_TYPE: "T",
                WANGKUTAN: "LN12000025",
                WNOSIM: "10140008000173",
                WNOPOLISI: "B 9486 UFU",
                L_LFIMG: "0",
                OP_LFIMG: "0",
                DOPLINE: "0000",
                VSLCD: "",
                VOYNR: "",
                DCHARG_1: "PS",
                RCHARG_1: "1011100684",
                RBWTAR_1: "TR-SALES",
            },
        };
        await client.open();
        const result = await client.call("ZRFC_PRE_REGISTRA_CUST", param);
        console.log(result);
    } catch (error) {
        console.log(error);
    }
})();
