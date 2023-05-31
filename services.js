/**
 * Cosmos DB Config
 */

const CosmosClient = require('@azure/cosmos').CosmosClient;

const { log } = require('console');
const config = require('./config');
const url = require('url');

const endpoint = config.endpoint;
const key = config.key;

const databaseId = config.database.id;
const containerId = config.container.id;
const partitionKey = { kind: 'Hash', paths: ['/id'] };

const options = {
    endpoint: endpoint,
    key: key,
    userAgentSuffix: 'CosmosDBJavascriptQuickstart',
};

const client = new CosmosClient(options);

/**
 * Create the database if it does not exist
 */
async function createDatabase() {
    const { database } = await client.databases.createIfNotExists({
        id: databaseId,
    });
    console.log(`Created database:\n${database.id}\n`);
}

/**
 * Read the database definition
 */
async function readDatabase() {
    const { resource: databaseDefinition } = await client
        .database(databaseId)
        .read();
    console.log(`Reading database:\n${databaseDefinition.id}\n`);
}

/**
 * Create the container if it does not exist
 */
async function createContainer() {
    const { container } = await client
        .database(databaseId)
        .containers.createIfNotExists({ id: containerId, partitionKey });
    console.log(`Created container:\n${config.container.id}\n`);
}

/**
 * Read the container definition
 */
async function readContainer() {
    const { resource: containerDefinition } = await client
        .database(databaseId)
        .container(containerId)
        .read();
    console.log(`Reading container:\n${containerDefinition.id}\n`);
}

/**
 * Scale a container
 * You can scale the throughput (RU/s) of your container up and down to meet the needs of the workload. Learn more: https://aka.ms/cosmos-request-units
 */
async function scaleContainer() {
    const { resource: containerDefinition } = await client
        .database(databaseId)
        .container(containerId)
        .read();

    try {
        const { resources: offers } = await client.offers.readAll().fetchAll();

        const newRups = 500;
        for (var offer of offers) {
            if (containerDefinition._rid !== offer.offerResourceId) {
                continue;
            }
            offer.content.offerThroughput = newRups;
            const offerToReplace = client.offer(offer.id);
            await offerToReplace.replace(offer);
            console.log(`Updated offer to ${newRups} RU/s\n`);
            break;
        }
    } catch (err) {
        if (err.code == 400) {
            console.log(`Cannot read container throuthput.\n`);
            console.log(err.body.message);
        } else {
            throw err;
        }
    }
}

/**
 * Get pokemons
 */

async function getPokemons(req, res) {
    const { id } = req.params;
    let querySpec = {
        query: 'SELECT * FROM Pokemons',
    };

    if (id) {
        querySpec = {
            query: 'SELECT * FROM Pokemons r WHERE r.id = @id',
            parameters: [
                {
                    name: '@id',
                    value: id,
                },
            ],
        };
    }

    const { resources: results } = await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll();

    res.json(results);
}

/**
 * Create Pokemons if it does not exist, else replace it (upsert)
 */
async function createPokemon(req, res) {
    const items = req.body
        ? [
              {
                  id: req.body.id,
                  name: req.body.name,
                  image: req.body.image,
                  height: req.body.height,
                  weight: req.body.weight,
                  type: req.body.type,
                  mainType: req.body.mainType,
                  maxCp: req.body.maxCp,
                  attack: req.body.attack,
                  defense: req.body.defense,
                  stamina: req.body.stamina,
                  hp: req.body.hp,
              },
          ]
        : req;

    const { item } = await Promise.all(
        items.map((itemDef) =>
            client
                .database(databaseId)
                .container(containerId)
                .items.upsert(itemDef)
        )
    );

    if (res) {
        res.json(items);
    } else {
        console.log(`Created pokemon items`);
    }
}

/**
 * Delete the item by ID.
 */
async function deletePokemon(req, res) {
    const { id } = req.params;

    await client
        .database(databaseId)
        .container(containerId)
        .item(id, id)
        .delete();
    res.send(`Deleted item:\n${id}\n`);
}

/**
 * Exit the app with a prompt
 * @param {string} message - The message to display
 */
function exit(message) {
    console.log(message);
    console.log('Press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}

const setupDatabase = createDatabase()
    .then(() => readDatabase())
    .then(() => createContainer())
    .then(() => readContainer())
    .then(() => scaleContainer())
    .then(() => createPokemon(config.items))
    .then(() => {
        exit(`Completed successfully`);
    })
    .catch((error) => {
        exit(`Completed with error ${JSON.stringify(error)}`);
    });

module.exports = { setupDatabase, getPokemons, createPokemon, deletePokemon };
