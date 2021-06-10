const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaderSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Leader = mongoose.model("Leader", leaderSchema);

module.exports = Leader;
