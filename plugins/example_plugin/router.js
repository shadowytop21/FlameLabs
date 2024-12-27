const express = require('express');
const router = express.Router();
const { db } = require('../../handlers/db')
# you need to add
# "instancesidebar": {
#       "example url": {
#           "url": "/instance/%id%/example",
#           "icon": "fa-solid fa-folder"
#       }
#   }

router.get('/instance/:id/example', (req, res) => {
    const { id } = req.params;

    res.render('index', {
        user: req.user,
        req
    });
});

module.exports = router;
