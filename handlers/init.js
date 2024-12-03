const { db } = require('../handlers/db.js');
const config = require('../config.json');
const { v4: uuidv4 } = require('uuid');
const CatLoggr = require('cat-loggr');
const log = new CatLoggr();

async function init() {
    const HydraPanel = await db.get('HydraPanel_instance');
    if (!HydraPanel) {
        log.init('this is probably your first time starting HydraPanel, welcome!');
        log.init('you can find documentation for the panel at undefined');

        let imageCheck = await db.get('images');
        if (!imageCheck) {
            log.error('before starting HydraPanel for the first time, you didn\'t run the seed command!');
            log.error('please run: npm run seed');
            log.error('if you didn\'t do it already, make a user for yourself: npm run createUser');
            process.exit();
        }

        let HydraPanelID = uuidv4();
        let setupTime = Date.now();
        
        let info = {
            HydraPanelID: HydraPanelID,
            setupTime: setupTime,
            originalVersion: config.version
        }

        await db.set('HydraPanel_instance', info)
        log.info('initialized HydraPanel panel with id: ' + HydraPanelID)
    }        

    log.info('init complete!')
}

module.exports = { init }