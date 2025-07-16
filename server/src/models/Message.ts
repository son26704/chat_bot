// server/src/models/Message.ts
import { Model, DataTypes } from 'sequelize';
import {sequelize} from '../db/database';
import Conversation from './Conversation';

class Message extends Model {
  public id!: string;
  public conversationId!: string;
  public content!: string;
  public role!: 'user' | 'assistant';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
  }
);

Message.belongsTo(Conversation, { foreignKey: 'conversationId' });
Conversation.hasMany(Message, { foreignKey: 'conversationId' });

export default Message;