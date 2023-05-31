const express = require('express');
const services = require('../services');
const router = express.Router();

router.get(['/pokemons', '/pokemon/:id'], (req, res) => {
    services.getPokemons(req, res);
});

router.post('/pokemon', (req, res) => {
    services.createPokemon(req, res);
});

router.delete('/pokemon/:id', (req, res) => {
    services.deletePokemon(req, res);
});

module.exports = router;
