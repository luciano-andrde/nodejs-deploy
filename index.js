const { Sequelize, DataTypes } = require('sequelize');

var db = new Sequelize({
  dialect: 'sqlite',
  storage: "./database.sqlite"
});

var columns = {
  user: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING }
}

var Logins = db.define('Login', columns);

var NutritionalInfoColumns = {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: Logins,
      key: 'id'
    },

    onDelete: 'CASCADE'
  },
  monday: { type: DataTypes.JSON },
  tuesday: { type: DataTypes.JSON },
  wednesday: { type: DataTypes.JSON },
  thursday: { type: DataTypes.JSON },
  friday: { type: DataTypes.JSON },
  saturday: { type: DataTypes.JSON },
  sunday: { type: DataTypes.JSON }
};

var NutritionalInfo = db.define('NutritionalInfo', NutritionalInfoColumns);

var WeeklyPlanColumns = {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: Logins,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  monday: { type: DataTypes.JSON },
  tuesday: { type: DataTypes.JSON },
  wednesday: { type: DataTypes.JSON },
  thursday: { type: DataTypes.JSON },
  friday: { type: DataTypes.JSON },
  saturday: { type: DataTypes.JSON },
  sunday: { type: DataTypes.JSON }
};

var WeeklyPlan = db.define('WeeklyPlan', WeeklyPlanColumns);

db.sync();


const Express = require('express');
const Cors = require('cors');

var api = new Express();

api.use(Cors());
api.use(Express.json());
api.use(Express.urlencoded({ extended: true }));

api.get('/logins', async (requisicao, resposta) => {
  var data = await Logins.findAll();
  resposta.json(data);
});

api.post('/logins', async (req, res) => {
  const { user, password, type } = req.body;

  try {
    const existingUser = await Logins.findOne({ where: { user } });
    if (existingUser) {
      return res.status(400).send("Usuário já existe.");
    }
    await Logins.create({ user, password, type });
    res.status(201).send("Usuário criado com sucesso.");
  }
  catch (error) {
    res.status(500).send("Erro ao criar o usuário", error);
    res.status(500).send("Erro ao criar o usuário. Detalhes: " + error.message);
  }
});

api.get("/logins", async (requisicao, resposta) => {
  //
});

api.delete("/logins", async (requisicao, resposta) => {
  const { id } = requisicao.body; // Ajustado para pegar o id corretamente

  try {
    await NutritionalInfo.destroy({ where: { userId: id } })

    const result = await Logins.destroy({ where: { id } });
    if (result === 0) {
      return resposta.status(404).send("Usuário não encontrado");
    }

    resposta.send("Usuário e informações nutricionais deletados com sucesso.");
  } catch (erro) {
    console.error("Erro ao deletar usuário:", erro);
    resposta.status(500).send("Erro ao deletar usuário.");
  }
});

api.get("/", (requisicao, resposta) => {
  resposta.json({ message: "Hello World" })
});

api.put("/logins/:user", async (req, res) => {
  const { user } = req.params;
  const { password } = req.body;

  try {
    const result = await Logins.update({ password }, { where: { user } });
    if (result[0] === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }
    res.send("Senha atualizada com sucesso.");
  } catch (error) {
    res.status(500).send("Erro ao atualizar a senha.");
  }
});

api.get('/nutritional-info/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log("ID solicitado:", id);  // Debug: Exibe o ID solicitado

    // Busca o registro do usuário com base no ID
    const userRecord = await Logins.findOne({ where: { id: id } });

    if (!userRecord) {
      console.log("Usuário não encontrado no banco de dados.");
      return res.status(404).send("Usuário não encontrado.");
    }

    console.log("Usuário encontrado:", userRecord);  // Debug: Exibe o registro do usuário encontrado

    // Usa o ID do usuário encontrado para buscar as informações nutricionais
    const info = await NutritionalInfo.findOne({ where: { userId: userRecord.id } });

    if (!info) {
      // Criar informações nutricionais padrão se não existirem
      const defaultMeals = {
        monday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        tuesday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        wednesday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        thursday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        friday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        saturday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        },
        sunday: {
          breakfast: "",
          lunch: "",
          afternoonSnack: "",
          dinner: "",
          supper: ""
        }
      };

      // Cria o registro nutricional com valores padrão
      await NutritionalInfo.create({ userId: userRecord.id, ...defaultMeals });
      return res.status(201).send("Informações nutricionais criadas com sucesso.");
    }

    // Retorna as informações nutricionais encontradas
    res.json(info);
  } catch (error) {
    console.log("Erro no servidor:", error.message);
    res.status(500).send("Erro no servidor.");
  }
});

// Endpoint para salvar informações nutricionais
api.post('/nutritional-info', async (req, res) => {
  const { id, meals } = req.body; // Alterado de user para id

  try {
    console.log("Dados recebidos: ", req.body);
    const nutritionalInfo = await NutritionalInfo.findOne({ where: { userId: id } }); // Usar id para buscar
    console.log("Informações nutricionais existentes: ", nutritionalInfo);

    if (nutritionalInfo) {
      await NutritionalInfo.update(meals, { where: { userId: id } }); // Usar id para atualizar
      res.send("Informações nutricionais atualizadas com sucesso.");
    } else {
      await NutritionalInfo.create({ userId: id, ...meals }); // Usar id ao criar
      res.status(201).send("Informações nutricionais criadas com sucesso.");
    }
  } catch (error) {
    res.status(500).send("Erro ao salvar informações nutricionais. Detalhes: " + error.message);
  }
});

api.get('/guardians', async (req, res) => {
  try {
    const guardians = await Logins.findAll({ where: { type: 'guardian' } });
    res.json(guardians);
  } catch (error) {
    res.status(500).send("Erro ao buscar usuários guardian.");
  }
});

api.get('/weekly-plan/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const weeklyPlan = await WeeklyPlan.findOne({ where: { userId: id } });

    if (!weeklyPlan) {
      const defaultPlan = {
        monday: {},
        tuesday: {},
        wednesday: {},
        thursday: {},
        friday: {},
        saturday: {},
        sunday: {}
      };
      await WeeklyPlan.create({ userId: id, ...defaultPlan });
      return res.status(201).send("Planejamento semanal criado com sucesso.");
    }

    res.json(weeklyPlan);
  } catch (error) {
    res.status(500).send("Erro ao buscar planejamento semanal.");
  }
});

api.post('/weekly-plan', async (req, res) => {
  const { clientId, weeklyPlan } = req.body;

  try {
    const existingPlan = await WeeklyPlan.findOne({ where: { userId: clientId } });

    if (existingPlan) {
      // Atualizar o plano semanal existente
      await WeeklyPlan.update(weeklyPlan, { where: { userId: clientId } });
      res.send("Planejamento semanal atualizado com sucesso.");
    } else {
      // Criar novo plano semanal
      await WeeklyPlan.create({ userId: clientId, ...weeklyPlan });
      res.status(201).send("Planejamento semanal criado com sucesso.");
    }
  } catch (error) {
    console.error("Erro ao salvar o planejamento semanal:", error);
    res.status(500).send("Erro ao salvar o planejamento semanal.");
  }
});

api.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});


api.listen(process.env.PORT || 4000, () => {
  console.log("Servidor em funcionamento")
  console.log("http://localhost:4000/logins")
});