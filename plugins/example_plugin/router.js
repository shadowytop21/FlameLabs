const express = require('express');
const router = express.Router();
const { db } = require('../../handlers/db')

router.get('/instance/:id/example', (req, res) => {
    const { id } = req.params;

    res.render('index', {
        user: req.user,
        req
    });
});

module.exports = router;