const { DataTypes } = require('sequelize');

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
});