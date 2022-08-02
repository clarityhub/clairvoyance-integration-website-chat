module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Auths',
      'publicKey',
      {
        type: Sequelize.STRING,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Auths', 'publicKey');
  },
};
