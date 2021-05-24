const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    const user = await User.findByPk(token);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });
  if (user) {
    return user.id;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const Note = conn.define("note", {
  text: {
    type: Sequelize.STRING,
  },
});


const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const notes = [
    { text: "I can't wait to log into this website" },
    { text: "I can't wait to log into this website either" },
    { text: "OMG this website is so cool" },
  ];

  // console.log("Magic Methods", Object.keys(User.prototype));

  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  await lucy.setNotes(note1);
  await moe.setNotes([note2, note3]);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

User.prototype.verifyPassword = function (inputPassword) {
  return inputPassword === this.password;
};

User.beforeCreate(async function hashPassword(user) {
  const SALT_COUNT = 5;
  const hashedPw = await bcrypt.hash(user.password, SALT_COUNT);
  // console.log(hashedPw);
  const isValid = await bcrypt.compare(user.password, hashedPw);
  // console.log(isValid);
});

Note.belongsTo(User);
User.hasMany(Note);

module.exports = {
  syncAndSeed,
  models: {
    User, Note
  },
};
