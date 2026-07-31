module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      checkMD5: false,
    },
    replSet: { count: 1 },
  },
};
