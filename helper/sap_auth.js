const basic_authtoken = btoa(`${process.env.UNAMESAP}:${process.env.PWDSAP}`);

module.exports = basic_authtoken;
