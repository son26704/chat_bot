// server/src/models/Conversation.ts
import { Model, DataTypes } from 'sequelize';
import {sequelize} from '../db/database';
import User from './User';

class Conversation extends Model {
  public id!: string;
  public userId!: string;
  public title!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
    timestamps: true,
  }
);

Conversation.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Conversation, { foreignKey: 'userId' });

export default Conversation;