const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../configs/sequelize');

const User = sequelize.define('User', {

    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
    },
}, {
    tableName: 'users',
    hooks: { beforeCreate: (user) => user.password = hashPassword(user.password) }
});

const hashPassword = (password) => {
    const saltRounds = 10;
    return bcrypt.hashSync(password, saltRounds);
};

User.prototype.isValidPassword = function (password) {
    return bcrypt.compareSync(password, this.password); // Compare hashed password with provided password
};

module.exports = { User };
